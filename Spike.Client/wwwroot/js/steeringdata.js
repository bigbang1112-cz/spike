const steps = 10;
const chartSteps = 500;

let globalMax = 0;
let globalMin = 0;

function stylizeTime(ms) {
	const seconds = ms / 1000;
	const minutes = Math.floor(seconds / 60);
	const remainingSeconds = (seconds - minutes * 60).toFixed(3);
	return `${minutes}:${remainingSeconds.padStart(6, '0')}`;
}

function* fillMissingValues(data, offset, length) {
	const end = length - offset;

	let prev = {
		time: 0,
		value: 0,
	};

	let reachedEnd = false;
	let reachedZero = false;

	// // I likely don't want this
	// // Fill in first value if it's not 0
	if (data[0].time > -offset) {
		yield prev;
	}

	// Fill in 0 value if it's not the first value

	function yieldEnd(value = prev.value) {
		reachedEnd = true;
		return { time: end, value: value };
	}

	for (let current of data) {
		if (current.time + offset > 0 && !reachedZero) {
			reachedZero = true;
			yield { time: -offset, value: prev.value };
		}

		// If current value is larger than end value, fill it
		if (current.time > end && !reachedEnd) {
			// Adjust value if its between two values
			const between = current.time + offset - length;

			if (between < steps) {
				// Experimental
				const adjustedValue =
					(prev.value - current.value) * (between / steps) + current.value;
				yield yieldEnd(adjustedValue);
			} else {
				yield yieldEnd();
			}
		}

		// If gap is larger than steps, fill it
		if (current.time - prev.time > steps) {
			// Calculate amount of gaps
			const numGaps = (current.time - prev.time) / steps - 1;

			yield { time: prev.time + steps * numGaps, value: prev.value };
		}

		yield current;
		prev = current;
	}

	// If end value is beyond last value, fill it
	if (!reachedEnd) {
		yield yieldEnd();
	}
}

function* processSteeringData(files) {
	for (let file of files) {
		const steeringData = file.steeringData;

		globalMax = Math.max(globalMax, file.length);
		globalMin = Math.min(globalMin, file.offset);

		const filledSteeringData = Array.from(
			fillMissingValues(steeringData, file.offset, file.length)
		);

		const adjustedSteeringData = filledSteeringData.map(({ time, value }) => {
			return {
				time: time + file.offset,
				value: value,
			};
		});

		yield {
			data: adjustedSteeringData,
			path: file.path,
			index: file.index,
			end: file.length,
		};
	}
}

const palette = ['ef476f', 'ffd166', '06d6a0', '118ab2', '073b4c'];

const defaultLabelOptions = {
	pointStyle: false,
	fill: false,
	cubicInterpolationMode: 'monotone',
	stepped: false,
	borderJoinStyle: 'round', // experimental
};

const dashAmount = 6;

function convertIntoChartData(data) {
	return data.map(({ time, value }) => ({
		x: time,
		y: value,
	}));
}

export function visualiseSteeringData(times, steers, offset, length, name) {
	console.log('Visualising...');

	const steeringData = Array.from(times, (time, index) => {
		return { time: time, value: steers[index] };
	});

	const dd = [{ steeringData, offset, length, path: name }];

	const chartData = Array.from(processSteeringData(dd)).map(({ data, path, index, end }) => {
		const color = '#' + palette[0 % palette.length];

		console.log(color);

		return {
			...defaultLabelOptions,
			label: path,

			segment: {
				borderColor: (ctx) => {
					return ctx.p0.parsed.x >= end || ctx.p0.parsed.x < 0 ? color + '77' : color;
				},
				borderDash: (ctx) => {
					return ctx.p0.parsed.x >= end || ctx.p0.parsed.x < 0
						? [dashAmount, dashAmount]
						: [];
				},
				borderDashOffset: (ctx) => {
					return ctx.p0.parsed.x >= end ? dashAmount : 0;
				},
			},

			borderDashOffset: dashAmount,
			borderColor: color,
			backgroundColor: color + '77',
			data: convertIntoChartData(data),
		};
	});

	const maxSteerAmount = 128;

	function* generateDummyData(max, steps) {
		for (var i = 0; i <= (max / steps) * 2 + 1; i++) {
			let value = i % 2 ? maxSteerAmount : -maxSteerAmount;
			yield {
				x: (i * steps) / 2,
				y: value,
			};
		}
	}

	const dummydata = Array.from(generateDummyData(globalMax, chartSteps));

	const data = {
		datasets: [
			// Dummy data, so the chart does not scale it's Y-axis when zoomed in
			...chartData,
			{
				label: '',
				data: dummydata,

				showLine: false,
				// pointStyle: 'line',
				pointHitRadius: 0,
				pointRadius: 0,
			},
		],
	};

	const scaleOpts = {
		ticks: {
			callback: (val, index, ticks) =>
				index === 0 || index === ticks.length - 1 ? null : val,
		},
	};

	const scales = {
		x: {
			type: 'linear',
			position: 'bottom',
			min: globalMin,
			max: globalMax,
			ticks: {
				callback: (val, index, ticks) => {
					return (index === 0 || index === ticks.length - 1) &&
						val !== globalMin &&
						val !== globalMax
						? null
						: stylizeTime(val);
				},
			},
		},
		y: {
			type: 'linear',
			position: 'left',
			reverse: true,
			min: -maxSteerAmount,
			max: maxSteerAmount,
			ticks: {
				callback: (val, index, ticks) =>
					val === -maxSteerAmount
						? 'Full Left'
						: val === maxSteerAmount
						? 'Full Right'
						: val,
			},
		},
	};

	// Object.keys(scales).forEach((scale) => Object.assign(scales[scale], scaleOpts));

	// ChartJS.defaults.font.family = 'Rubik';

	const options = {
		animation: false,
		responsive: true,
		plugins: {
			tooltip: {
				enabled: true,
				callbacks: {
					title: (context) => {
						const time = context[0].raw.x;
						return stylizeTime(time);
					},
					label: (context) => {
						const value = context.raw.y;
						return value === -(maxSteerAmount - 1)
							? 'Full Left'
							: value === maxSteerAmount - 1
							? 'Full Right'
							: value;
					},
				},
			},
			// Code to hide the dummy dataset in the legend
			legend: {
				labels: {
					filter: function (item, data) {
						// Returning true will show the item
						if (item.text) return true;
					},
				},
			},
			// Zoom plugin
			zoom: {
				limits: {
					x: { min: 'original', max: 'original', minRange: chartSteps },
					y: { min: 'original', max: 'original', minRange: 254 },
				},
				pan: {
					enabled: true,
					mode: 'x',
				},
				zoom: {
					drag: {
						enabled: true,
						modifierKey: 'ctrl',
					},
					wheel: {
						enabled: true,
					},
					pinch: {
						enabled: true,
					},
					mode: 'x',
				},
			},
		},
		scales: scales,
	};

	let chart;

	let graphStepped = false;
	let graphSmooth = true;
	let graphYReversed = true;

	const config = {
		type: 'line',
		data: data,
		options: options,
	};

	new Chart(document.getElementById('spike-chart'), config);
}
