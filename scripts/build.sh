#!/usr/bin/env bash
# Compila la web en dist/: un solo app.js y app.css minificados, sin comentarios ni mapas de fuente.
# Lo que se publica en el repositorio público es solo el contenido de dist/.
set -euo pipefail
cd "$(dirname "$0")/.."
rm -rf dist && mkdir -p dist/assets
ESB="npx -y esbuild@0.24.0"
printf "import './charts.js';\nimport './main.js';\n" > assets/js/_entrada.js
$ESB assets/js/_entrada.js --bundle --format=esm --minify --legal-comments=none --target=es2020 --outfile=dist/assets/app.js
rm assets/js/_entrada.js
$ESB assets/css/app.css --minify --legal-comments=none --outfile=dist/assets/app.css
sed -i 's#../fonts/#fonts/#g' dist/assets/app.css
cp -r assets/fonts assets/vendor assets/favicon.svg dist/assets/
v=$(cat dist/assets/app.js dist/assets/app.css | sha1sum | cut -c1-8)
sed -e "s#assets/css/app.css#assets/app.css?v=$v#" \
    -e '/assets\/js\/charts.js/d' \
    -e "s#assets/js/main.js?v=[0-9]*#assets/app.js?v=$v#" index.html > dist/index.html
touch dist/.nojekyll
printf 'User-agent: *\nDisallow: /\n' > dist/robots.txt
echo "dist listo (v=$v)"
