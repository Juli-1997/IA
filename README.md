# Brújula Colombia

Chatbot web estático para explorar destinos turísticos de Colombia.

## Archivos
- `index.html`: interfaz del chatbot.
- `styles.css`: diseño adaptable con estética de atlas antiguo y animación del avión de papel.
- `script.js`: conversación, recomendaciones, tolerancia a errores y aceptación de destinos.
- `destinos.json`: base ampliada de destinos colombianos.

## Cómo ejecutarlo
1. Descomprime la carpeta.
2. Ábrela en Visual Studio Code.
3. Inicia `index.html` con Live Server.

No abras el HTML con doble clic: el navegador puede bloquear la lectura de `destinos.json`.

## Novedades
- La base pasa de 20 a 40 destinos.
- Se agregan ríos, cascadas, montañas, cañones, parques naturales, monumentos y sitios arqueológicos e históricos.
- Las recomendaciones reconocen consultas como “recomiéndame ríos”, “quiero ver cascadas”, “montañas”, “monumentos” y “sitios históricos”.
- Al responder afirmativamente a una recomendación, aparece un avión de papel animado y se confirma el destino elegido.
- Se conservan los saludos animados, las fuentes y la interfaz existente.

## Importante
Es un chatbot de búsqueda por coincidencias sobre `destinos.json`, no un modelo generativo. Los accesos, horarios, cupos y condiciones de parques y senderos pueden cambiar; verifica siempre la información oficial antes de viajar.
