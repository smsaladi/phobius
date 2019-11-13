#
# Just build subdirectory
#

export CC = emcc
BUILD_DIR = public

all:
	mkdir -p preload && cp decodeanhmm/test/phobius* preload/
	$(MAKE) -C decodeanhmm $@
	ln -s decodeanhmm/decodeanhmm decodeanhmm.bc

	$(CC) decodeanhmm.bc -o $(BUILD_DIR)/project.js \
		-s FORCE_FILESYSTEM=1 --preload-file preload \
		-s MODULARIZE=1 -s 'EXPORT_NAME="Phobius"'

clean:
	rm -r preload *.bc $(BUILD_DIR)/project.*
	$(MAKE) -C decodeanhmm $@
