const spawn = require("child_process").spawn;

function imgOpti() {
	return new Promise((resolve, reject) => {
		const child = spawn('./image-opti.sh', [`./static`]);
		child.stdout.pipe(process.stdout);
		child.stderr.pipe(process.stderr);

		child.on('exit', code => {
			if (code === 0) {
				console.log("Assets optimised");
				resolve();
			} else {
				reject(`Process failed with error code ${code}`);
			}
		});
	});
}
imgOpti();
