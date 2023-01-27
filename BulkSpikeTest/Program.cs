using GBX.NET;
using GBX.NET.Engines.Game;
using Spike;

if (args.Length == 0)
{
    Console.WriteLine("No file specified.");
    return;
}

var path = args[0];

foreach (var ghostFile in Directory.EnumerateFiles(path, "*.Ghost.Gbx", SearchOption.AllDirectories))
{
    try
    {
        var ghost = GameBox.ParseNode<CGameCtnGhost>(ghostFile);
        var spike = new SpikeTool(ghost);

        var spikes = spike.Run();

        if (spikes.HasValue)
        {
            var (count, atSec) = spikes.Value;

            Console.WriteLine($"[{Path.GetFileName(Path.GetDirectoryName(ghostFile))}] {Path.GetFileName(ghostFile)} -> {count} spikes at sec num {atSec} ({ghost.GhostNickname})");
        }
    }
    catch (Exception ex)
    {
        Console.WriteLine(ex);
    }
}