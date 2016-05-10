#include <stdio.h>
#include <unistd.h>
#include <sys/ioctl.h>

int main()
{
    int pid = 0;

    // create pipe pair
    int fd[2];
    pipe(fd);

    pid = fork();
    if (pid == 0)
    {
        // child side
        char *buff = NULL;
        char byte = 0;
        int count = 0;

        // close write side. don't need it.
        close(fd[1]);

        // read at least one byte from the pipe.
        while (read(fd[0], &byte, 1) == 1)
        {
            if (ioctl(fd[0], FIONREAD, &count) != -1)
            {
                fprintf(stdout,"Child: count = %d\n",count);

                // allocate space for the byte we just read + the rest
                //  of whatever is on the pipe.
                buff = malloc(count+1);
                buff[0] = byte;
                if (read(fd[0], buff+1, count) == count)
                    fprintf(stdout,"Child: received \"%s\"\n", buff);
                free(buff);
            }
            else
            {   // could not read in-size
                perror("Failed to read input size.");
            }
        }

        // close our side
        close(fd[0]);
        fprintf(stdout,"Child: Shutting down.\n");
    }
    else
    {   // close read size. don't need it.
        const char msg1[] = "Message From Parent";
        const char msg2[] = "Another Message From Parent";
        close(fd[0]);
        sleep(5); // simulate process wait
        fprintf(stdout, "Parent: sending \"%s\"\n", msg1);
        write(fd[1], msg1, sizeof(msg1));
        sleep(5); // simulate process wait
        fprintf(stdout, "Parent: sending \"%s\"\n", msg2);
        write(fd[1], msg2, sizeof(msg2));
        close(fd[1]);
        fprintf(stdout,"Parent: Shutting down.\n");
    }
    return 0;
}

