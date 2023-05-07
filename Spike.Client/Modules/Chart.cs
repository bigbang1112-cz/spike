using System.Runtime.InteropServices.JavaScript;

using GBX.NET.Engines.Game;
using GBX.NET.Inputs;

namespace Spike.Client.Modules;

internal static partial class Chart
{
	[JSImport("initaliseChart", nameof(Chart))]
	public static partial void InitaliseChart();

	[JSImport("addSteeringGraph", nameof(Chart))]
	public static partial void AddSteeringGraph(int[] times, double[] steers, int offset, int length, int index, string name);

	public static void InitaliseCharts()
	{
		InitaliseChart();
	}

	public static void VisualiseGhost(CGameCtnGhost ghost, string fileName, int index = 0)
	{
		if (ghost == null)
		{
			return;
		}

		var inputs = ghost?.PlayerInputs?.FirstOrDefault()?.Inputs;

		var offset = ghost?.PlayerInputs?.FirstOrDefault()?.StartOffset?.TotalMilliseconds ?? 0;
		var length = ghost?.RaceTime?.TotalMilliseconds ?? 0;

		var name = fileName;

		if (inputs != null)
		{
			var times = inputs.OfType<SteerTM2020>().Select(item => item.Time.TotalMilliseconds).ToArray();
			var steers = inputs.OfType<SteerTM2020>().Select(item => (double)item.Value).ToArray();

			AddSteeringGraph(times, steers, offset, length, index, name);
		}
	}
}
