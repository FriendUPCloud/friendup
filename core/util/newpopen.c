/*
 * popen() for stdin, stdout and stderr.
 *
 * Based on popenRWE() by Bart Trojanowski.
 *
 * Copyright (C) 2012 Tobias Klauser <tklauser@distanz.ch>
 * Copyright (C) 2009-2010 Bart Trojanowski <bart@jukie.net>
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 */

#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>

/**
 * Pipe stream to an application (like popen() but for std{in,out,err}).
 *
 * After successful return:
 *  - write to pipes[0] will go to stdin of the child
 *  - read from pipes[1] to get stdout of the child
 *  - read from pipes[2] to get stderr of the child
 *
 * @param cmd    external command to execute
 * @param pipes  int array of three to write FDs for std{in,out,err} to
 * @return       PID of the executed application on success, -1 otherwise
 */
pid_t newpopen(const char *cmd, int *pipes)
{
	int in[2], out[2], err[2];
	pid_t pid;
	int ret;

	/* Open pipes to stdin, stdout, stderr */
	ret = pipe(in);
	if (ret < 0)
		goto err_in;

	ret = pipe(out);
	if (ret < 0)
		goto err_out;

	ret = pipe(err);
	if (ret < 0)
		goto err_err;

	pid = fork();
	if (pid > 0) {          /* parent */
		close(in[0]);
		close(out[1]);
		close(err[1]);
		pipes[0] = in[1];
		pipes[1] = out[0];
		pipes[2] = err[0];
		return pid;
	} else if (pid == 0) {  /* child */
		close(in[1]);
		close(out[0]);
		close(err[0]);
		dup2(in[0], 0);
		dup2(out[1], 1);
		dup2(err[1], 2);

		/* just emulate what popen() does */
		execl("/bin/sh", "sh", "-c", cmd, NULL);
		exit(EXIT_FAILURE);
	} else
		goto err_fork;

	return pid;

err_fork:
	close(err[0]);
	close(err[1]);
err_err:
	close(out[0]);
	close(out[1]);
err_out:
	close(in[0]);
	close(in[1]);
err_in:
	return ret;
}

/**
 * Close pipes previously opened with popen3.
 *
 * @param pid
 * @param pipes
 * @return
 */
int newpclose(pid_t pid, int *pipes)
{
	int ret, status;
	close(pipes[0]);
	close(pipes[1]);
	close(pipes[2]);
	ret = waitpid(pid, &status, 0);
	if (ret == 0)
		return status;
	else
		return ret;
}
