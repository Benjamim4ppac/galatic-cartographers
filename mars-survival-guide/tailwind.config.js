// Gera css/tailwind.css (só é preciso rodar de novo se mudar classes):
// npx tailwindcss@3 -i ./tools/tailwind-input.css -o ./css/tailwind.css --minify
module.exports = { content: ['./index.html', './js/**/*.js'], theme: { extend: {} }, plugins: [] };
