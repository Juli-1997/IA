# Brújula Colombia

Chatbot web estático para explorar destinos turísticos de Colombia.

## Archivos
- `index.html`: estructura de la interfaz.
- `styles.css`: diseño adaptable con estética de atlas antiguo y fantasía, papel cálido y colores vivos.
- `script.js`: conversación, búsqueda, tolerancia a errores pequeños de escritura y respuestas.
- `destinos.json`: base de destinos colombianos.

## Cómo ejecutarlo
1. Descomprime la carpeta y ábrela en Visual Studio Code.
2. Instala la extensión **Live Server** si todavía no la tienes.
3. Haz clic derecho sobre `index.html`.
4. Selecciona **Open with Live Server**.

No abras el HTML directamente con doble clic: el navegador puede bloquear la lectura de `destinos.json`.

## Cambios incluidos
- Las tarjetas muestran la pregunta completa antes de seleccionarla.
- Las preguntas rápidas del chat también muestran el texto que se enviará.
- La búsqueda no distingue entre mayúsculas y minúsculas ni entre tildes.
- Corrige errores simples de una letra (letra agregada, omitida, cambiada o transpuesta) en palabras relacionadas con los destinos y el turismo.
- Conserva el texto original que escribe la persona en el chat.
- Nueva paleta más colorida, con apariencia de atlas antiguo y fantasía.

## Alcance
Es un chatbot de búsqueda por coincidencias sobre la base `destinos.json`, no un modelo generativo. Las fuentes enlazadas son referencias para consulta; verifica horarios, precios y condiciones con fuentes oficiales antes de viajar.
