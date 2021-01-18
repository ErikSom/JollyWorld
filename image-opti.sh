#!/bin/sh

if [ -z "$1" ]; then
	echo "Please specify directory"
	exit 1
fi

# a unique ID in case we wanna do stuff with the original files in the future / to avoid losing quality
original_marker=original-lupyw

cp_smallest() {
	# $1 file1
	# $2 file1
	# $3 destination

	size_1=$(wc -c < "$1" | xargs)
	size_1=$(wc -c < "$1" | xargs)

	if test $size_1 -lt $size_1; then
		if test "$1" != "$3"; then
			cp "$1" "$3"
		fi
	else
		if test "$2" != "$3"; then
			cp "$2" "$3"
		fi
	fi
}

optimize_png() {
	# $1 = source
	# $2 = destination

	# nofs because dithering looks bad and is bigger for game graphics
	# imo it's only good for photographs
	./bins/pngquant "$1" --quality='65-80' --nofs --strip --skip-if-larger -o "$2" --force || true
	if test ! -f "$2"; then
		# pngquant couldn't optimize this further so it did not write it to disk
		cp "$1" "$2"
	fi

	# optipng takes a lot of times and doesn't improve filesize that much
	# which is why it's disabled but feel free to enable
	# optipng -o7 -strip all $file
}

optimize_jpeg() {
	# $1 = source
	# $2 = destination

	set +e
	# this will fail if you have the original cjpeg from libjpeg (or libjpeg-turbo)
	# because only mozjpeg supports jpeg -> jpeg
	# mozjpeg has to be installed, specifically
	stderr=$(./bins/cjpeg -quality 70 "$1" 2>&1 > "$2")
	retval=$?
	if test $retval -ne 0 && [[ "$stderr" =~ 'Unrecognized input file format' ]]; then
		echo 'Please install mozjpeg' >&2
		exit 2
	fi
	set -e

	# don't keep output if it became bigger
	cp_smallest "$1" "$2" "$2"
}

optimize_ogg() {
	# $1 = source
	# $2 = destination

	./bins/sox "$1" -t wav - | oggenc - --downmix -q 1 -o "$2"

	# don't keep output if it became bigger
	cp_smallest "$1" "$2" "$2"
}

optimize_mp3() {
	# $1 = source
	# $2 = destination

	./bins/lame --nohist -V 7 -mm "$1" "$2"

	# don't keep output if it became bigger
	cp_smallest "$1" "$2" "$2"
}

# if I don't use a for loop here, it's because they suck! Motherfuckers can't handle spaces https://unix.stackexchange.com/questions/9496/looping-through-files-with-spaces-in-the-names
find $1 -type f \( -name "*.png" -or -name "*.jpeg" -or -name "*.jpg" -or -name "*.ogg" -or -name "*.mp3" \) ! -name "*.$original_marker.*" -print0 | while IFS= read -r -d '' file; do
	filename=$(basename -- "$file")
	extension="${filename##*.}"
	filename="${filename%.*}"

	original_file=$(dirname "$file")/"$filename".$original_marker."$extension"
	if test ! -f "$original_file"; then
		# this will break if there is a thing in front of basename
		cp "$file" "$original_file"
	fi

	case $extension in
		png)
			optimize_png "$original_file" "$file"
			;;
		jpg | jpeg)
			optimize_jpeg "$original_file" "$file"
			;;
		ogg)
			optimize_ogg "$original_file" "$file"
			;;
		mp3)
			optimize_mp3 "$original_file" "$file"
			;;
	esac

	rm "$original_file"

done

echo 'Optimized assets'
