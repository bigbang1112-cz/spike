using System.Runtime.InteropServices.JavaScript;

namespace Spike.Client.Modules;

internal static partial class Chart
{
	[JSImport("initaliseChart", nameof(Chart))]
	public static partial void InitaliseChart(int maxSteerAmount);

	[JSImport("addSteeringGraph", nameof(Chart))]
	public static partial void AddSteeringGraph(int[] times, double[] steers, int offset, int length, int index, string name);
}
