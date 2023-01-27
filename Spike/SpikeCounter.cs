using GBX.NET.Engines.Game;
using GBX.NET.Inputs;
using TmEssentials;

namespace Spike;

public class SpikeCounter
{
    public int Tolerance { get; set; } = 8;

    public IEnumerable<TimeInt32> Count(CGameCtnGhost.PlayerInputData inputData)
    {
        return Count(inputData.Inputs);
    }

    public IEnumerable<TimeInt32> Count(IEnumerable<IInput> inputs)
    {
        return Count(inputs.OfType<SteerTM2020>()); // Concat with other game inputs
    }
    
    public IEnumerable<TimeInt32> Count(IEnumerable<SteerTM2020> inputs)
    {
        var prevSteer = default(sbyte?);
        var prevDiffSteer = 0;

        foreach (var steer in inputs)
        {
            prevSteer ??= steer.Value;
            int diffSteer = prevSteer.Value - steer.Value;

            if (prevDiffSteer * diffSteer < 0) // both non-0 and different direction movement
            {
                if (Math.Abs(prevDiffSteer - diffSteer) >= Tolerance * 2) // adding the values of both last movements
                {
                    yield return steer.Time; // spike, respectively end of the spike, the peak is always the tick before
                }
            }

            prevSteer = steer.Value;
            prevDiffSteer = diffSteer;
        }
    }

    public IEnumerable<int> CountPerSecond(CGameCtnGhost.PlayerInputData inputData)
    {
        return CountPerSecond(inputData.Inputs);
    }

    public IEnumerable<int> CountPerSecond(IEnumerable<IInput> inputs)
    {
        return CountPerSecond(inputs.OfType<SteerTM2020>()); // Concat with other game inputs
    }

    public IEnumerable<int> CountPerSecond(IEnumerable<SteerTM2020> inputs, TimeInt32 offset = default)
    {
        var counter = 0;
        var prevTimestamp = TimeInt32.Zero;

        foreach (var timestamp in Count(inputs))
        {
            counter++;

            if ((timestamp + offset).Seconds != (prevTimestamp + offset).Seconds)
            {
                yield return counter;
                counter = 0;
            }

            prevTimestamp = timestamp;
        }
    }
}
