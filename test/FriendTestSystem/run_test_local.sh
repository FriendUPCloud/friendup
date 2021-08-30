echo "Test started"

cd "${0%/*}" #cd into the directory where this script is placed

python3 ./master.py -l test -p test -s true >test.out
cat test.out | mail -s 'Atuomatic CI test' email@test1.com email@test2.com

