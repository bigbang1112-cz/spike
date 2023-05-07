const steps = 10;
const chartSteps = 500;

let globalMax = 0;
let globalMin = 0;

let chart;

function stylizeTime(ms) {
	const seconds = Math.abs(ms / 1000);
	const minutes = Math.floor(seconds / 60);
	const remainingSeconds = (seconds - minutes * 60).toFixed(3);
	const sign = ms < 0 ? '-' : '';
	return `${sign}${minutes}:${remainingSeconds.padStart(6, '0')}`;
}

function* fillMissingValues(data, offset, length) {
	const end = length - offset;

	let prev = {
		time: 0,
		value: 0,
	};

	let reachedEnd = false;
	let reachedZero = false;

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

const maxSteerAmount = 128;

export function initaliseChart() {
	globalMin = 0;
	globalMax = 0;

	const scalesDefault = {
		grid: {
			color: '#46474B',
		},
		ticks: {
			color: '#46474B',
			fontColor: '#46474B',
			font: {
				family: "'Kanit', Rubik, sans-serif",
			},
		},
		border: {
			color: '#46474B',
		},
	};

	const scales = {
		x: {
			...scalesDefault,
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
			...scalesDefault,
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

	const options = {
		animation: false,
		responsive: true,
		maintainAspectRatio: false,

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
						const label = context.dataset.label;

						const updatedValue =
							value === -(maxSteerAmount - 1)
								? 'Full Left'
								: value === maxSteerAmount - 1
								? 'Full Right'
								: value;

						return `${label}: ${updatedValue}`;
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
					y: { min: 'original', max: 'original', minRange: 127 * 2 },
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

	const config = {
		type: 'line',
		//data: data,
		options: options,
	};

	chart = new Chart(document.getElementById('spike-chart'), config);
}

function* generateDummyData(max, steps) {
	for (var i = 0; i <= (max / steps) * 2 + 1; i++) {
		let value = i % 2 ? maxSteerAmount : -maxSteerAmount;
		yield {
			x: (i * steps) / 2,
			y: value,
		};
	}
}

const consoleBadge = [
	'color: white',
	'background: #8338ec',
	'border-radius: 2px',
	'font-weight: bold',
	'padding: 0 4px',
].join(';');

export function addSteeringGraph(times, steers, offset, length, index, name) {
	console.log('%cDebug', consoleBadge, `Visualising Ghost #${index} (${name})`);

	const steeringData = Array.from(times, (time, index) => {
		return { time: time, value: steers[index] };
	});

	const color = '#' + palette[index % palette.length];

	globalMax = Math.max(globalMax, length);
	globalMin = Math.min(globalMin, offset);

	const filledSteeringData = Array.from(fillMissingValues(steeringData, offset, length));

	const adjustedSteeringData = filledSteeringData.map(({ time, value }) => {
		return {
			time: time + offset,
			value: value,
		};
	});

	const chartData = {
		...defaultLabelOptions,
		label: name,

		segment: {
			borderColor: (ctx) => {
				return ctx.p0.parsed.x >= length || ctx.p0.parsed.x < 0 ? color + '77' : color;
			},
			borderDash: (ctx) => {
				return ctx.p0.parsed.x >= length || ctx.p0.parsed.x < 0
					? [dashAmount, dashAmount]
					: [];
			},
			borderDashOffset: (ctx) => {
				return ctx.p0.parsed.x >= length ? dashAmount : 0;
			},
		},

		borderDashOffset: dashAmount,
		borderColor: color,
		backgroundColor: color + '77',
		data: convertIntoChartData(adjustedSteeringData),
	};

	chart.data.datasets.push(chartData);

	chart.options.scales.x.min = globalMin;
	chart.options.scales.x.max = globalMax;
	// = {
	// 	type: 'linear',
	// 	position: 'bottom',
	// 	min: globalMin,
	// 	max: globalMax,
	// 	ticks: {
	// 		callback: (val, index, ticks) => {
	// 			return (index === 0 || index === ticks.length - 1) &&
	// 				val !== globalMin &&
	// 				val !== globalMax
	// 				? null
	// 				: stylizeTime(val);
	// 		},
	// 	},
	// };

	chart.update();
}
