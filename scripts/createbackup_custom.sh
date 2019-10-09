#!/usr/bin/env bash
#
# Create Friend Backup
#
# Parameters:
#
# key = -i blablabla.pem
# user = name of user
# password = user password
# port_small = port parameter used by ssh
# port = port parameter used by scp
# server = host name
# storepath = path where backup file will be stored
# compression = use compression yes/no
# directories = directory names which backup will contain. Stored as string, names are separated by comma. This option works only when type is equal to "partial"

#
# Set variables
#

time_stamp=$(date +%Y-%m-%d-%H-%M-%S)
log_file=${current_backup_dir}/backup_log.txt

dblogin=root
dbpass=kongluboMy90!!
backup_path=/home/
backup_dst=/home/serverbackup/backups/hetzner/
archive=no
compression=no
port="-P 24"
port_small="-p 24"
user=serverbackup
password=GettingThingsHome43enHalv
server=pal.ideverket.no

echo "Backup started: $(date +%Y-%m-%d-%T)" > ${log_file}

echo "Compression: $compression"
if [ -z "$compression" ]
then
	echo "Compression not set, using default option: yes"
else
	archive="$compression"
fi

#
# Do backup
#

echo "$(date +%Y-%m-%d-%T): Copy files" >> ${log_file}

if [ "$archive" = "yes" ] && [! -z "$server" ]
then
	# store all files in archive
	echo "$(date +%Y-%m-%d-%T): Start compression" >> ${log_file}
	echo "Create archive"
	archivepath="backup_$(time_stamp)"
	tar -zcvf ${archivepath} ${backup_path}
	SSHPASS=${password} sshpass -e ssh $port_small $user@$server "mkdir -p $backup_dst"
	SSHPASS=${password} sshpass -e rsync -raz -e "ssh ${port_small}" $archivepath $user@$server:$backup_dst >> ${log_file} 2>&1
	rm -rf ${archivepath}
else
	echo "$(date +%Y-%m-%d-%T): Copy files" >> ${log_file}
	SSHPASS=${password} sshpass -e rsync -raz -e "ssh ${port_small}" $backup_path/* $user@$server:$backup_dst >> ${log_file} 2>&1
fi

#
# Dump database
#

echo "$(date +%Y-%m-%d-%T): Dump database" >> ${log_file}

echo "Create database backup"

mysqldump -u $dblogin -p$dbpassword --all-databases > backup.sql

SSHPASS=${password} sshpass -e rsync -raz -e "ssh ${port_small}" backup.sql $user@$server:$backup_dst/ >> ${log_file} 2>&1

VALUE=$(SSHPASS=${password} sshpass -e ssh $port_small $user@$server "find $backup_dst  -maxdepth 1 -type d | wc -l")
if [ "${VALUE}" -gt "1" ]; then
	SSHPASS=${password} sshpass -e ssh $port_small $user@$server "find $backup_dst -mtime +7 -maxdepth 1  -exec rm -rf {} \;"
fi

