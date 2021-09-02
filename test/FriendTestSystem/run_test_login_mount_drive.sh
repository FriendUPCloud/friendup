echo "Test started"

cd "${0%/*}" #cd into the directory where this script is placed

python3 ./master.py -l stefkos -p stefkos -s true -t loginmountdrive >test.out
cat test.out | mail -s 'Atuomatic CI test' email@test1.com email@test2.com

