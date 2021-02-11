echo "Test started"

cd "${0%/*}" #cd into the directory where this script is placed

python3 ./master.py -l pawel -p workpawel -s true >test.out
cat test.out | mail -s 'Atuomatic CI test' ps@friendup.cloud ht@friendup.cloud #artur.langner@friendup.cloud

