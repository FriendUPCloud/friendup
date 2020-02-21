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
# Parse configuration
#

. bash-ini-parser
cfg_parser 'cfg/cfg.ini'

#
# Set variables
#

backup_type=all
archive=yes
backup_path=../backup
time_stamp=$(date +%Y-%m-%d-%H-%M-%S)
current_backup_dir=${backup_path}/${time_stamp}
backup_file_name=backup_archive_${time_stamp}
archive_path=${backup_path}/${backup_file_name}.tar.gz
storage_directory=""
log_file=${current_backup_dir}/backup_log.txt

mkdir -p "${current_backup_dir}"

echo "Backup started: $(date +%Y-%m-%d-%T)" > ${log_file}

cfg_section_FriendCore
storage_directory="$fcupload"

cfg_section_Backup
echo "Backup Type: $type"
if [ -z "$type" ]
then
	echo "Type server not set, using default option: all"
else
	backup_type="$type"
fi

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
	if [ "$backup_type" = "all" ]
	then
		echo "Create storage files backup (all)"
		rsync -ravl ${storage_directory}* ${current_backup_dir}/ --exclude 'log'
	else
		if [ -z "$directories" ]
		then
			echo "Create storage files backup"
			mkdir -p "${current_backup_dir}/storage"
			rsync -ravl ${storage_directory}* ${current_backup_dir}/storage

			echo "Create cfg files backup"
			mkdir -p "${current_backup_dir}/cfg"
			rsync -ravl cfg/* ${current_backup_dir}/cfg
		else
			echo "Create storage files backup: ${directories}"
			IFS=',' read -r -a array <<< "$directories"
			for i in "${array[@]}"
			do
				mkdir -p "${current_backup_dir}/$i"
				rsync -ravl $i/* ${current_backup_dir}/$i
			done
		fi
	fi
else
	# send all files separated
	if [ "$backup_type" = "all" ]
	then
		echo "Create storage files backup (all)"
		SSHPASS=${password} sshpass -e ssh $port_small $user@$server "mkdir -p $storepath$backup_file_name/build"
		SSHPASS=${password} sshpass -e rsync -raz -e "ssh ${port_small}" * $user@$server:$storepath$backup_file_name/build --exclude 'log' >> ${log_file} 2>&1
	else
		if [ -z "$directories" ]
		then
			echo "Create storage files backup"
			SSHPASS=${password} sshpass -e ssh $port_small $user@$server "mkdir -p $storepath$backup_file_name/storage $storepath$backup_file_name/cfg $storepath$backup_file_name/services" >> ${log_file} 2>&1
			echo "sshpass -e rsync -raz -e \"ssh $port_small\" ${storage_directory} $user@$server:$storepath$backup_file_name/storage"
			SSHPASS=${password} sshpass -e rsync -raz -e "ssh ${port_small}" ${storage_directory} $user@$server:$storepath$backup_file_name/storage >> ${log_file} 2>&1
			SSHPASS=${password} sshpass -e rsync -raz -e "ssh ${port_small}" cfg/ $user@$server:$storepath$backup_file_name/cfg >> ${log_file} 2>&1
			SSHPASS=${password} sshpass -e rsync -raz -e "ssh ${port_small}" services/ $user@$server:$storepath$backup_file_name/services >> ${log_file} 2>&1
		else
			echo "Create storage files backup: ${directories}"
			IFS=',' read -r -a array <<< "$directories"
			for i in "${array[@]}"
			do
				SSHPASS=${password} sshpass -e ssh $port_small $user@$server "mkdir -p $storepath$backup_file_name/$i" >> ${log_file} 2>&1
				SSHPASS=${password} sshpass -e rsync -raz -e "ssh ${port_small}" $i/* $user@$server:$storepath$backup_file_name/$i >> ${log_file} 2>&1
			done
		fi
	fi
fi

#
# Dump database
#

echo "$(date +%Y-%m-%d-%T): Dump database" >> ${log_file}
cfg_section_DatabaseUser
echo "Create database backup"
mkdir -p "${current_backup_dir}/db"

mysqldump -u $login -p$password --databases $dbname > ${current_backup_dir}/db/frienddb_backup.sql

cfg_section_Backup

#
# Read additional properties from backup.cfg
#

input="backup.cfg"
option=0

comarray=()     #array of commands

OLDIFS=${IFS}

# check if backup.cfg exist
if [ -f "$input" ]
then
	declare -a comarray
	delim=","

	while IFS=, read -r -a farray
	do
		if [ "${farray[0]}" = "delimeter" ]; then
			option=3
		elif [ $option = 3 ]; then
			locvar=${farray[0]}
			delim=${locvar:0:1}
			option=0
		fi
	done < "${input}"

	echo "Delimeter : ->${delim}<-"

	option=0

	while IFS="${delim}" read -r -a farray
	do
		#echo "Line : ${farray[0]}  option ${option}"

		if [ "${farray[0]}" = "delimeter" ]; then
			option=3
		elif [ "${farray[0]}" = "databases" ]; then
			option=1
		elif [ "${farray[0]}" = "directories" ]; then
			option=2
		else
			locvar=${farray[0]}
			if [ ! -z "$locvar" ]; then
				firstchar=${locvar:0:1}
				if [ $firstchar = '#' ]; then
					echo "Line skipped"
				else
					if [ $option = 1 ]; then
						#database name, login, password, dbname
						#comarray+=("mysqldump -u ${farray[1]} -p${farray[2]} --databases ${farray[3]} > ${current_backup_dir}/db/${farray[0]}.sql")
						echo "mysqldump -u ${farray[1]} -p${farray[2]} --databases ${farray[3]} > ${current_backup_dir}/db/${farray[0]}.sql"
						mysqldump -u ${farray[1]} -p${farray[2]} --databases ${farray[3]} > ${current_backup_dir}/db/${farray[0]}.sql
					elif [ $option = 2 ]; then
						#echo "Line: ${farray[0]}"
						#directories name, path
						#SSHPASS=${password} sshpass -e ssh $port_small $user@$server 'mkdir -p $storepath$backup_file_name/${farray[0]}'
						#SSHPASS=${password} sshpass -e rsync -raz -e "ssh ${port_small}" ${farray[1]}/* $user@$server:$storepath$backup_file_name/${farray[0]}/
						comarray+=("SSHPASS=${password} sshpass -e ssh $port_small $user@$server 'mkdir -p $storepath$backup_file_name/${farray[0]}'")
						comarray+=("SSHPASS=${password} sshpass -e rsync -raz -e \"ssh ${port_small}\" ${farray[1]}/* $user@$server:$storepath$backup_file_name/${farray[0]}/")
					fi
				fi
			fi
		fi
	done < "${input}"
fi

IFS=${OLDIFS}

for line in "${comarray[@]}"; do
	#set $line
	echo "===>${line}"
	eval ${line}
done



#
# Copy generated files
#

echo "$(date +%Y-%m-%d-%T): Copy generated files" >> ${log_file}
git branch > ${current_backup_dir}/git_info
git rev-parse HEAD >> ${current_backup_dir}/git_info
SSHPASS=${password} sshpass -e rsync -raz -e "ssh ${port_small}" ${current_backup_dir}/db/*.sql $user@$server:$storepath$backup_file_name/ >> ${log_file} 2>&1
#SSHPASS=${password} sshpass -e rsync -raz -e "ssh ${port_small}" ${current_backup_dir}/db/frienddb_backup.sql $user@$server:$storepath$backup_file_name/frienddb_backup.sql >> ${log_file} 2>&1
#SSHPASS=${password} sshpass -e rsync -raz -e "ssh ${port_small}" ${current_backup_dir}/db/friendchatdb_backup.sql $user@$server:$storepath$backup_file_name/friendchatdb_backup.sql >> ${log_file} 2>&1
#SSHPASS=${password} sshpass -e rsync -raz -e "ssh ${port_small}" ${current_backup_dir}/db/presencedb_backup.sql $user@$server:$storepath$backup_file_name/presencedb_backup.sql >> ${log_file} 2>&1
SSHPASS=${password} sshpass -e rsync -raz -e "ssh ${port_small}" ${current_backup_dir}/git_info $user@$server:$storepath$backup_file_name/git_info >> ${log_file} 2>&1

#
# Compress everything
#

if [ "$archive" = "yes" ]
then
	echo "$(date +%Y-%m-%d-%T): Start compression" >> ${log_file}
	echo "Create archive"
	tar -zcvf $archive_path ${current_backup_dir}
	rm -rf ${current_backup_dir}
fi
#
# Send file to server
#

cfg_section_Backup
echo "Sending data to server"

if [ "$archive" = "yes" ]
then
	echo "$(date +%Y-%m-%d-%T): Send archive to server" >> ${log_file}
	if [ -z "$server" ]
	then
		echo "Server value not set, archive will not be transfered to backup server"
	else
		if [ -z "$password" ]
		then
			scp $port $key $archive_path $user@$server:$storepath
		else
			echo "Using command line: sshpass -p '${password}' scp -oBatchMode=no $port $key $archive_path $user@$server:$storepath"
			SSHPASS=${password} sshpass -e scp -o StrictHostKeyChecking=no $port $key $archive_path $user@$server:$storepath 
		fi
	fi
fi

#
# Delete old files (older then 7 days)
#

echo "$(date +%Y-%m-%d-%T): Clean old files" >> ${log_file}
echo "Delete old files"
find $backup_path -mtime +7 -type f -delete

#
# Delete older backups on remote server
#

if [ -z "$storepath" ]
then
	echo "'storepath' is empty, cannot use empty path to remove remote data"
else
	VALUE=$(SSHPASS=${password} sshpass -e ssh $port_small $user@$server "find $storepath  -maxdepth 1 -type d | wc -l")
	if [ "${VALUE}" -gt "1" ]; then
		SSHPASS=${password} sshpass -e ssh $port_small $user@$server "find $storepath -mtime +7 -maxdepth 1  -exec rm -rf {} \;"
	fi
fi

echo "$(date +%Y-%m-%d-%T): Backup complete" >> ${log_file}
SSHPASS=${password} sshpass -e rsync -raz -e "ssh ${port_small}" ${log_file} $user@$server:$storepath$backup_file_name/log




