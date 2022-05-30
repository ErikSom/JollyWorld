from os import walk

for (_, _, filenames) in walk('C:/Users/Warze/Desktop/testing'):
	print(filenames)