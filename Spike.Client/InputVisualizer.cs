using GBX.NET.Engines.Game;
using GBX.NET.Inputs;
using Spike.Client.Modules;

namespace Spike.Client;

class InputVisualizer(CGameCtnGhost ghost, string fileName, bool hasOlderTM, int index)
{
    public void VisualiseAsSteeringGraph()
    {
        if (ghost.PlayerInputs?.FirstOrDefault() is CGameCtnGhost.PlayerInputData inputData)
        {
            VisualiseTM2020Inputs(inputData);
        }

        if (ghost.Inputs?.Count > 0)
        {
            VisualiseTMInputs(ghost.Inputs);
        }
    }

    private void VisualiseTM2020Inputs(CGameCtnGhost.PlayerInputData inputData)
    {
        var inputs = inputData.Inputs;

        var offset = inputData.StartOffset?.TotalMilliseconds ?? 0;
        var length = ghost.RaceTime?.TotalMilliseconds ?? 0;

        var times = inputs.OfType<SteerTM2020>().Select(item => item.Time.TotalMilliseconds).ToArray();
        var steers = inputs.OfType<SteerTM2020>().Select(item => (double)(item.Value * (hasOlderTM ? 512 : 1))).ToArray();

        Chart.AddSteeringGraph(times, steers, offset, length, index, name: fileName);
    }

    private void VisualiseTMInputs(IReadOnlyCollection<IInput> inputs)
    {
        var offset = inputs.Min(input => input.Time.TotalMilliseconds);
        var length = ghost.RaceTime?.TotalMilliseconds ?? 0;

        var times = new List<int>();
        var steers = new List<double>();

        foreach (var input in inputs)
        {
            if (input is Steer steer)
            {
                times.Add(input.Time.TotalMilliseconds);
                steers.Add(steer.Value);
            }
            else if (input is SteerLeft steerLeft)
            {
                times.Add(input.Time.TotalMilliseconds);
                steers.Add(steerLeft.Pressed ? -65536 : 0);
            }
            else if (input is SteerRight steerRight)
            {
                times.Add(input.Time.TotalMilliseconds);
                steers.Add(steerRight.Pressed ? 65536 : 0);
            }
        }

        Chart.AddSteeringGraph(times.ToArray(), steers.ToArray(), offset, length, index, name: fileName);
    }
}
