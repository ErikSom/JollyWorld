from os import walk

for (_, _, filenames) in walk('C:/Users/Warze/Documents/GitHub/JollyWorld/static/mod/wardrobe'):
	print(filenames)