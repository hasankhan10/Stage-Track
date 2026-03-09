const fs = require('fs');
const path = require('path');

function walk(dir, callback) {
    fs.readdir(dir, function (err, list) {
        if (err) return callback(err);
        let i = 0;
        (function next() {
            let file = list[i++];
            if (!file) return callback(null);
            file = path.resolve(dir, file);
            fs.stat(file, function (err, stat) {
                if (stat && stat.isDirectory()) {
                    walk(file, function (err, res) {
                        next();
                    });
                } else {
                    if (file.endsWith('.ts') || file.endsWith('.tsx')) {
                        let content = fs.readFileSync(file, 'utf8');
                        if (content.includes('StageTrack')) {
                            let newContent = content.replace(/StageTrack/g, 'Stova Media');
                            newContent = newContent.replace(/stagetrack\.app/g, 'stovamedia.com');
                            fs.writeFileSync(file, newContent);
                            console.log('Updated', file);
                        }
                    }
                    next();
                }
            });
        })();
    });
}

walk('m:/Stage Track/src', function (err) {
    if (err) throw err;
    console.log('Done');
});
