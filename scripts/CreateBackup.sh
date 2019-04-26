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

if [ -z "$backup_type" ]
then
	echo "Create storage files backup"
	mkdir -p "${current_backup_dir}/storage"
	cfg_section_FriendCore
	rsync -ravl $fcupload* ${current_backup_dir}/storage

	echo "Create cfg files backup"
	mkdir -p "${current_backup_dir}/cfg"
	rsync -ravl cfg/* ${current_backup_dir}/cfg
else
	echo "Create storage files backup (all)"
	cfg_section_FriendCore
	rsync -ravl * ${current_backup_dir}/
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
	scp $key $archive_path $user@$server:$storepath
fi
