using System.Runtime.InteropServices.JavaScript;

using GBX.NET.Engines.Game;
using GBX.NET.Inputs;

namespace Spike.Client.Modules;

internal static partial class SteeringData
{
	[JSImport("visualiseSteeringData", nameof(SteeringData))]
	public static partial void VisualiseSteeringData(int[] times, double[] steers, int offset, int length, int index, string name);

	public static void GetSteeringDataFromGhost(CGameCtnGhost ghost)
	{
		if (ghost == null)
		{
			return;
		}

		var inputs = ghost?.PlayerInputs?.FirstOrDefault()?.Inputs;

		var offset = ghost?.PlayerInputs?.FirstOrDefault()?.StartOffset?.TotalMilliseconds ?? 0;
		var length = ghost?.RaceTime?.TotalMilliseconds ?? 0;

		var index = 0; // Needs to be implemented
		var name = ghost?.Validate_ChallengeUid ?? "Unknown";

		if (inputs != null)
		{
			var times = inputs.OfType<SteerTM2020>().Select(item => item.Time.TotalMilliseconds).ToArray();
			var steers = inputs.OfType<SteerTM2020>().Select(item => (double)item.Value).ToArray();

			VisualiseSteeringData(times, steers, offset, length, index, name);
		}
	}
}
