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

backup_path=../backup
time_stamp=$(date +%Y-%m-%d-%T)
current_backup_dir=${backup_path}/${time_stamp}
archive_path=${backup_path}/backup_archive_${time_stamp}.tar.gz
mkdir -p "${current_backup_dir}"

echo "Create storage files backup"
mkdir -p "${current_backup_dir}/storage"
cfg_section_FriendCore
rsync -ravl $fcupload* ${current_backup_dir}/storage

echo "Create cfg files backup"
mkdir -p "${current_backup_dir}/cfg"
rsync -ravl cfg/* ${current_backup_dir}/cfg

cfg_section_DatabaseUser
echo "Create database backup"
mkdir -p "${current_backup_dir}/db"
echo 
mysqldump -u $login -p$password --databases $dbname > ${current_backup_dir}/db/dump.sql

#
# Compress everything
#

echo "Create archive"
tar -zcvf $archive_path ${current_backup_dir}

#
# Send file to server
#

scp -i AWSWorkspace.pem $archive_path pal@pal.ideverket.no:/home/ubuntu/

