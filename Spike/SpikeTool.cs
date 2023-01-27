﻿using GBX.NET.Engines.Game;
using GbxToolAPI;

namespace Spike;

public class SpikeTool : Tool
{
    private readonly CGameCtnGhost ghost;

    public SpikeTool(CGameCtnGhost ghost)
    {
        this.ghost = ghost;
    }

    public (int, int)? Run() // temporary method for testing stuff
    {
        var inputs = ghost.PlayerInputs?.FirstOrDefault();

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
