
LIB_DIR = user properties application mysql z image

ALL:
	for dir in $(LIB_DIR); do \
		make -C $$dir; \
	done

install:
	for dir in $(LIB_DIR); do \
		make -C $$dir install; \
	done

setup:
	for dir in $(LIB_DIR); do \
		make -C $$dir setup; \
	done

clean:
	for dir in $(LIB_DIR); do \
		make -C $$dir clean; \
	done

compile:
	for dir in $(LIB_DIR); do \
		make -C $$dir DEBUG=1; \
	done

release:
	for dir in $(LIB_DIR); do \
                make -C $$dir release; \
        done


