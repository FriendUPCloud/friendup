#!/usr/bin/env bash
#
# Create Friend Backup
#

#
# ini parser
#

. bash-ini-parser
#cfg.parser '../build/cfg/cfg.ini'
cfg_parser 'cfg/cfg.ini'

#
# Action
#

backup_type=all
backup_path=../backup
time_stamp=$(date +%Y-%m-%d-%T)
current_backup_dir=${backup_path}/${time_stamp}
archive_path=${backup_path}/backup_archive_${time_stamp}.tar.gz

mkdir -p "${current_backup_dir}"

cfg_section_Backup
echo "Backup Type: $type"
if [ -z "$type" ]
then
	echo "Type server not set, using default option"
else
	backup_type="$type"
fi

#
# Doing backup
#

#if [ -z "$backup_type" ]
if [ "$backup_type" = "all" ]
then
	echo "Create storage files backup (all)"
	cfg_section_FriendCore
	rsync -ravl * ${current_backup_dir}/ --exclude 'log'
else
	echo "Create storage files backup"
	mkdir -p "${current_backup_dir}/storage"
	cfg_section_FriendCore
	rsync -ravl $fcupload* ${current_backup_dir}/storage

	echo "Create cfg files backup"
	mkdir -p "${current_backup_dir}/cfg"
	rsync -ravl cfg/* ${current_backup_dir}/cfg
fi

cfg_section_DatabaseUser
echo "Create database backup"
mkdir -p "${current_backup_dir}/db"

mysqldump -u $login -p$password --databases $dbname > ${current_backup_dir}/db/dump.sql

#
# Compress everything
#

echo "Create archive"
tar -zcvf $archive_path ${current_backup_dir}
rm -rf ${current_backup_dir}

#
# Send file to server
#

cfg_section_Backup
echo "Sending data to server"
# key = -i blablabla.pem
# user = name of user
# server = host name
# storepath = path where backup file will be stored
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
		#echo "Using command line: echo '${password}' | scp -o StrictHostKeyChecking=no $port $key $archive_path $user@$server:$storepath "
		#echo "${password}" | scp -o StrictHostKeyChecking=no $port $key $archive_path $user@$server:$storepath 
	fi
fi

#
# Delete old files (older then 7 days)
#

echo "Delete old files"
find $backup_path -mtime +7 -type f -delete

