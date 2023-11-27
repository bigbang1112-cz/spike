using GBX.NET.Engines.Game;
using GbxToolAPI;

namespace Spike;

[ToolName("Spike")]
[ToolAuthors("ThaumicTom & BigBang1112")]
[ToolDescription("Input analysis tool.")]
[ToolGitHub("bigbang1112-cz/spike")]
public class SpikeTool : ITool, IConfigurable<SpikeConfig>
{
    public IEnumerable<CGameCtnGhost> Ghosts { get; }

    public SpikeConfig Config { get; set; } = new();

    public SpikeTool(CGameCtnGhost ghost)
    {
        Ghosts = Enumerable.Repeat(ghost, 1);
    }

    public SpikeTool(CGameCtnReplayRecord replay)
    {
        Ghosts = replay.GetGhosts();
    }

    public SpikeTool(IEnumerable<CGameCtnGhost> ghosts)
    {
        Ghosts = ghosts;
    }

    public (int, int)? Run() // temporary method for testing stuff (not invoked by reflection anywhere)
    {
        var inputs = Ghosts.FirstOrDefault()?.PlayerInputs?.FirstOrDefault();

        if (inputs is null)
        {
            Console.WriteLine("No inputs found.");
            return null;
        }

        var spikeCounter = new SpikeCounter();
        var spikes = spikeCounter.CountPerSecond(inputs);

        var secCounter = 0;
        var highestCount = 0;
        var highestCountSec = 0;

        foreach (var spikeCount in spikes)
        {
            if (spikeCount > highestCount)
            {
                highestCount = spikeCount;
                highestCountSec = secCounter;
            }

            secCounter++;
        }

        if (highestCount > 12)
        {
            return (highestCount, highestCountSec);
        }

        return null;
    }
}
