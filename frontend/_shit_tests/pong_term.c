#include <stdio.h>
#include <unistd.h>   /* usleep */
#include <time.h>     /* time, localtime, strftime */

int main(void)
{
    /* big ASCII title (user-provided) */
    const char *hdr[] = {
        "░█░█░█▀▀░█░░░█▀▀░█▀█░█▄█░█▀▀░░░▀█▀░█▀█░░            ",
        "░█▄█░█▀▀░█░░░█░░░█░█░█░█░█▀▀░░░░█░░█░█░░            ",
        "░▀░▀░▀▀▀░▀▀▀░▀▀▀░▀▀▀░▀░▀░▀▀▀░░░░▀░░▀▀▀░░            ",
        "░░░░░░░░░░░░                                        ",
        "░▄▄▄░▄▄▄░▄▄▄                                        ",
        "░░░░░░░░░░░░                                        ",
        "░▀█▀░█░█░█▀▀░░░█▀▄░█▀█░▀█▀░█░░░█░█░░░█▀█░█▀█░█▀█░█▀▀", 
        "░░█░░█▀█░█▀▀░░░█░█░█▀█░░█░░█░░░░█░░░░█▀▀░█░█░█░█░█░█",
        "░░▀░░▀░▀░▀▀▀░░░▀▀░░▀░▀░▀▀▀░▀▀▀░░▀░░░░▀░░░▀▀▀░▀░▀░▀▀▀",
        "░░░░░░░░░░░░                                        ",
        "░▄▄▄░▄▄▄░▄▄▄                                        ",
        "░░░░░░░░░░░░                                        ",
        "░█▀▀░█▀█░█▄█░█▀▀░░░█▀▀░▀█▀░█▀█░▀█▀░█▀▀              ",
        "░█░█░█▀█░█░█░█▀▀░░░▀▀█░░█░░█▀█░░█░░▀▀█              ",
        "░▀▀▀░▀░▀░▀░▀░▀▀▀░░░▀▀▀░░▀░░▀░▀░░▀░░▀▀▀              ",
        "",
    };

    const char *statuses[] = {
        "Serving", "Rallying", "Charging", "Defending", "Smashing", "Taunting"
    };

    const char *moods[] = {
        "Calm", "On fire", "Tilted", "Zen", "Focused", "Distracted"
    };

    /* fake rotating values (kept simple, deterministic) */
    int p1_score[] = {0, 1, 2, 2, 3, 4, 4, 5, 6, 6, 7, 8, 8, 9, 10};
    int p2_score[] = {0, 0, 1, 2, 2, 2, 3, 3, 4, 5, 5, 6, 7, 7, 8};
    int rounds = sizeof(p1_score) / sizeof(p1_score[0]);
    int tick = 0;

    for (;;)
    {
        /* clear screen and move cursor to home */
        printf("\033[2J\033[H");

        /* print header */
        for (size_t h = 0; h < sizeof(hdr)/sizeof(hdr[0]); ++h)
            printf("%s\n", hdr[h]);

    /* boxed subtitle, emphasized */
    printf("  +--------------------------------------------------+\n");
    printf("  |  \033[1m\033[4mLet's get some stats !\033[0m\n");
    printf("  +--------------------------------------------------+\n");

    /* big separator before time */
    printf("  =================================================\n");

        /* print time */
        {
            char tbuf[64];
            time_t now = time(NULL);
            struct tm *lt = localtime(&now);
            strftime(tbuf, sizeof(tbuf), "%Y-%m-%d %H:%M:%S", lt);
            /* make 'Live' bold and the timestamp underlined */
            printf("  \033[1mLive:\033[0m \033[4m%s\033[0m\n\n", tbuf);
        }

        /* compute index */
        int idx = tick % rounds;
        int s = tick % (int)(sizeof(statuses)/sizeof(statuses[0]));
        int m = (tick / 3) % (int)(sizeof(moods)/sizeof(moods[0]));

    /* Player blocks with one-stat-per-line (no table) */
    printf("  \033[1m\033[4mPlayer 1:\033[0m %s\n", "ALPHA");
    printf("    Score:  %2d\n", p1_score[idx]);
    printf("    Streak: %2d\n", (tick+2) % 8);
    printf("    Status: %s\n", statuses[s]);
    printf("    \033[4mAccuracy:\033[0m %2d%%\n", 60 + ((tick*7)%40));
    printf("    Ping:     %3d ms\n", 30 + ((tick*13)%120));
    printf("    Mood:     %s\n\n", moods[m]);
    /* separator */
    printf("  \033[1m--------------------------------------------------\033[0m\n\n");
    printf("  \033[1m\033[4mPlayer 2:\033[0m %s\n", "OMEGA");
    printf("    Score:  %2d\n", p2_score[idx]);
    printf("    Streak: %2d\n", (tick+5) % 6);
    printf("    Status: %s\n", statuses[(s+2) % (sizeof(statuses)/sizeof(statuses[0]))]);
    printf("    \033[4mAccuracy:\033[0m %2d%%\n", 55 + ((tick*11)%45));
    printf("    Ping:     %3d ms\n", 25 + ((tick*17)%130));
    printf("    Mood:     %s\n\n", moods[(m+3) % (sizeof(moods)/sizeof(moods[0]))]);

        /* extra metrics with emphasis */
        printf("  \033[1mBall Speed:\033[0m %3d km/h   | Crowd: %s\n",
               80 + ((tick*9)%60), (tick % 5 == 0) ? "\033[1mROARING\033[0m" : "murmuring");
        printf("  \033[1mHighlights:\033[0m \033[31m%s\033[0m\n\n", (tick%7==0) ? "SICK BACKSPIN WIN" : "—");

        /* underlined quit message */
        printf("  \033[4m(Press Ctrl+C to quit)\033[0m\n");

        fflush(stdout);

        usleep(750000); /* 0.75s between updates */
        tick++;

        /* loop forever, but wrap tick to avoid overflow */
        if (tick > 1000000) tick = 0;
    }

    return 0;
}