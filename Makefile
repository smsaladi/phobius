#
# Just build subdirectory
#

export CC = emcc

all:
	mkdir -p preload && cp decodeanhmm/test/phobius* preload/
	$(MAKE) -C decodeanhmm $@
	ln -s decodeanhmm/decodeanhmm decodeanhmm.bc

	$(CC) decodeanhmm.bc -o project.js \
		-s FORCE_FILESYSTEM=1 --preload-file preload

clean:
	rm -r preload *.bc project.js project.data project.wasm
	$(MAKE) -C decodeanhmm $@
