let destinos = [];
let lastQuestion = "";
let destinoPendiente = null;
const messages = document.getElementById("messages");
const form = document.getElementById("chatForm");
const input = document.getElementById("userInput");
const sendButton = form.querySelector("button");

const normalizar = (texto) => String(texto).toLocaleLowerCase("es").normalize("NFD").replace(/[\u0300-\u036f]/g, "");

// Diccionario construido a partir del atlas. Permite reconocer errores pequeños
// de escritura sin cambiar el texto original que ve la persona en el chat.
function distanciaEdicion(a, b) {
  if (Math.abs(a.length - b.length) > 1) return 2;
  let anterior = Array.from({length: b.length + 1}, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const actual = [i];
    for (let j = 1; j <= b.length; j++) {
      actual[j] = Math.min(
        actual[j - 1] + 1,
        anterior[j] + 1,
        anterior[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
    anterior = actual;
  }
  return anterior[b.length];
}

function construirDiccionario() {
  const base = [
    "recomiendame","recomienda","recomiendas","recomendar","lugares","lugar",
    "destinos","destino","visitar","conocer","playas","playa","naturaleza",
    "aventura","historia","cultura","gastronomia","tranquilo","tranquila",
    "pareja","bonitos","bonitas","colombia","departamento","region","hacer",
    "puedo","quiero","donde","adonde","viaje","viajar","montaña","montanas",
    "cascadas","pueblos","magicos","magicos","ayudar","hola","gracias",
    "antioquia","guajira","caribe","andina","pacifica","amazonia","orinoquia",
    "rio","rios","cascada","cascadas","montana","montanas","nevado","nevados",
    "monumento","monumentos","historico","historicos","arqueologia","canyon","canon",
    "cocuy","purace","tatacoa","chicamocha","guejar","magdalena","guayabero",
    "tequendama","bordones","mortino","mompox","popayan","tierradentro","perdida"
  ];
  const datos = destinos.flatMap(d => [
    d.nombre, d.depto, d.region, ...(d.cats || []), ...(d.tags || [])
  ]);
  return [...new Set([...base, ...datos].map(normalizar)
    .flatMap(p => p.split(/[^a-z0-9]+/)).filter(p => p.length >= 4))];
}

function corregirConsulta(texto) {
  const palabras = construirDiccionario();
  return normalizar(texto).replace(/[a-záéíóúñü]+/gi, palabra => {
    const token = normalizar(palabra);
    if (token.length < 4 || palabras.includes(token)) return token;
    let mejor = null;
    let mejorDistancia = 2;
    for (const candidata of palabras) {
      if (Math.abs(candidata.length - token.length) > 1) continue;
      const distancia = distanciaEdicion(token, candidata);
      if (distancia < mejorDistancia) {
        mejor = candidata;
        mejorDistancia = distancia;
      } else if (distancia === mejorDistancia) {
        mejor = null; // Evita corregir cuando hay varias opciones igual de probables.
      }
    }
    return mejor && mejorDistancia === 1 ? mejor : token;
  });
}

const escapar = (texto) => String(texto).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));

async function cargarDestinos() {
  try {
    const respuesta = await fetch("destinos.json");
    if (!respuesta.ok) throw new Error("No se pudo cargar destinos.json");
    destinos = await respuesta.json();
  } catch (error) {
    console.error(error);
    agregarRespuesta("Tuve un pequeño problema al abrir mi atlas de destinos. Comprueba que iniciaste la página con Live Server y vuelve a intentarlo.", null, true);
  }
}

function agregarMensaje(texto, tipo) {
  const fila = document.createElement("div");
  fila.className = `message-row ${tipo === "user" ? "user-row" : "bot-row"}`;
  const avatar = tipo === "user" ? '<div class="message-avatar user-avatar">♡</div>' : '<div class="message-avatar">✳</div>';
  fila.innerHTML = `${avatar}<div class="message-content"><div class="bubble ${tipo === "user" ? "user-bubble" : "bot-bubble"}">${escapar(texto)}</div></div>`;
  messages.appendChild(fila);
  bajarChat();
}

function mostrarEspera() {
  const fila = document.createElement("div");
  fila.className = "message-row bot-row";
  fila.id = "typingIndicator";
  fila.innerHTML = '<div class="message-avatar">✳</div><div class="message-content"><div class="typing-caption">Brújula está buscando en su mapa...</div><div class="typing-bubble" aria-label="Brújula está pensando"><span></span><span></span><span></span></div></div>';
  messages.appendChild(fila);
  bajarChat();
}
function quitarEspera() { document.getElementById("typingIndicator")?.remove(); }
function bajarChat() { messages.scrollTop = messages.scrollHeight; }

function avisoLimites() {
  return '<div class="disclaimer">ⓘ Respuesta orientativa basada en la información disponible. Confirma los datos importantes con fuentes oficiales antes de viajar.</div>';
}

function agregarRespuesta(texto, destinosFuente = [], sinDatos = false, efecto = "") {
  const fila = document.createElement("div");
  fila.className = `message-row bot-row${efecto ? " special-reply" : ""}`;
  let extra = "";
  const lista = Array.isArray(destinosFuente) ? destinosFuente : (destinosFuente ? [destinosFuente] : []);
  if (lista.length) {
    extra = '<div class="answer-sources"><span class="source-heading">✧ Para seguir explorando</span>' + lista.slice(0, 3).map(d => `<a class="answer-source" href="${escapar(d.url)}" target="_blank" rel="noopener noreferrer"><span>↗</span><span><b>${escapar(d.fuente)}</b><small>Consultar fuente</small></span></a>`).join("") + '</div>';
  }
  if (sinDatos) extra += '<button class="retry-button" type="button">↻ Volver a intentar</button>';
  const nota = efecto ? "" : avisoLimites();
  fila.innerHTML = `<div class="message-avatar">✳</div><div class="message-content"><div class="bubble bot-bubble">${escapar(texto)}</div>${extra}${nota}</div>`;
  messages.appendChild(fila);
  if (efecto === "bienvenida") lanzarDecoracion();
  if (efecto === "viaje") lanzarAvionDePapel();
  fila.querySelector(".retry-button")?.addEventListener("click", () => enviarPregunta(lastQuestion));
  bajarChat();
}

// Pequeña lluvia de símbolos que aparece únicamente en saludos y preguntas sociales.
function lanzarDecoracion() {
  const capa = document.createElement("div");
  capa.className = "welcome-sparkles";
  capa.setAttribute("aria-hidden", "true");
  const adornos = ["💖", "✨", "💗", "✈️", "📚", "⭐", "♡", "📖", "💫", "✧", "💕", "🛩️", "💝", "🌟", "🪽", "📜", "🧭", "🕊️", "💓", "✦", "🪶", "💌"];
  // Varias tandas llenan la pantalla sin tapar ni bloquear el chat.
  for (let i = 0; i < 34; i++) {
    const simbolo = adornos[i % adornos.length];
    const pieza = document.createElement("span");
    pieza.className = "welcome-float";
    pieza.textContent = simbolo;
    pieza.style.setProperty("--left", `${2 + Math.random() * 96}%`);
    pieza.style.setProperty("--delay", `${Math.random() * 1.8}s`);
    pieza.style.setProperty("--duration", `${4.8 + Math.random() * 2.7}s`);
    pieza.style.setProperty("--drift", `${Math.round(Math.random() * 260 - 130)}px`);
    // Mezcla de símbolos medianos y otros realmente grandes.
    const tamano = i % 6 === 0 ? 66 + Math.random() * 28 : 34 + Math.random() * 38;
    pieza.style.setProperty("--size", `${tamano}px`);
    capa.appendChild(pieza);
  }
  document.body.appendChild(capa);
  window.setTimeout(() => capa.remove(), 9000);
}

function lanzarAvionDePapel() {
  const capa = document.createElement("div");
  capa.className = "paper-plane-scene";
  capa.setAttribute("aria-hidden", "true");
  capa.innerHTML = '<span class="paper-plane">➤</span><span class="plane-trail"></span><span class="plane-star plane-star-one">✦</span><span class="plane-star plane-star-two">✧</span><span class="plane-note">¡Rumbo a una nueva aventura!</span>';
  document.body.appendChild(capa);
  window.setTimeout(() => capa.remove(), 3600);
}

const saludos = ["hola", "holi", "buenas", "buenos dias", "buenas tardes", "buenas noches", "hey", "hello"];
const categorias = [
  {label:"playa", keys:["playa","playas","mar","costa","isla","islas","caribe"]},
  {label:"rios", keys:["rio","rios","río","ríos","river","caudal","navegacion","navegar"]},
  {label:"cascadas", keys:["cascada","cascadas","salto de agua","chorro","caida de agua","pozos naturales"]},
  {label:"montanas", keys:["montana","montanas","montaña","montañas","nevado","nevados","volcan","volcanes","paramo","paramos","alta montana","cordillera"]},
  {label:"monumentos", keys:["monumento","monumentos","estatua","estatuas","escultura","esculturas","fortaleza","castillo","puente historico"]},
  {label:"sitios historicos", keys:["sitio historico","sitios historicos","historia","historico","historica","arqueologia","arqueologico","colonial","museo","patrimonio","pueblo"]},
  {label:"naturaleza", keys:["naturaleza","selva","paisaje","aves","bosque","ecoturismo","cueva","desierto"]},
  {label:"aventura", keys:["aventura","extremo","rafting","senderismo","caminata","caminar","adrenalina","deporte"]},
  {label:"historia", keys:["historia","historico","historica","cultura","colonial","museo","patrimonio","pueblo"]},
  {label:"gastronomia", keys:["gastronomia","comida","comer","platos","comida tipica"]}
];

function recomendarPorPreferencia(q) {
  const cat = categorias.find(c => c.keys.some(k => q.includes(normalizar(k))));
  if (!cat) return null;
  const encontrados = destinos.filter(d =>
    (d.cats || []).some(c => normalizar(c) === normalizar(cat.label)) ||
    (d.tags || []).some(t => cat.keys.some(k => normalizar(t).includes(normalizar(k)))) ||
    (cat.label === "sitios historicos" && (d.cats || []).some(c => ["historia","cultura"].includes(normalizar(c))))
  ).slice(0, 4);
  if (!encontrados.length) return null;
  const nombres = encontrados.map(d => d.nombre).join(", ");
  const intro = {
    playa:"Si sueñas con brisa marina y paisajes azules, mira estas opciones",
    naturaleza:"Para respirar aire puro y estar cerca de paisajes naturales, podrías visitar",
    aventura:"Si te gustaría salir de la rutina y vivir algo diferente, considera",
    historia:"Si te gustan los lugares con historias, arquitectura y tradición, te propongo",
    gastronomia:"Para descubrir sabores y tradiciones locales, puedes empezar por"
  };
  return {texto:`${intro[cat.label]}: ${nombres}.\n\nMi sugerencia es comenzar por ${encontrados[0].nombre}: ${encontrados[0].desc}\n\nSi me cuentas desde dónde viajarías, cuántos días tienes y qué tipo de plan te gusta, puedo afinar mucho más la recomendación.`, fuentes:encontrados};
}

function buscarRespuesta(pregunta) {
  const q = corregirConsulta(pregunta).trim();
  if (!q) return null;

  // Conversación cotidiana y saludos.
  if (saludos.some(s => q === s || q.startsWith(s + " ") || q.startsWith(s + "!"))) {
    return {texto:"¡Holaaaa, qué felicidad que estés aquí! 💖🌷✨ Te mando un abrazo enorme lleno de cariño. Soy Brújula, tu compañerita de aventuras, y me emociona muchísimo compartir contigo los rinconcitos más mágicos de Colombia. 💕✈️📚 ¿Cómo va tu día, corazón?", fuentes:[], efecto:"bienvenida"};
  }
  if (/como estas|como te va|que tal estas|todo bien/.test(q)) {
    return {texto:"¡Ayyyy, ahora estoy todavía mejor porque viniste a saludarme! 🥰💗 Estoy feliz, con mucha ilusión y lista para acompañarte a soñar con viajes preciosos. Gracias por preguntarme, personita bonita. ✨💖 ¿Y tú cómo estás? Te mando estrellitas, abrazos y buenos deseos. 🌟💕", fuentes:[], efecto:"bienvenida"};
  }
  if (/gracias|muchas gracias|te agradezco/.test(q)) {
    return {texto:"¡Con muchísimo gusto! 💜 Para eso estoy, para ayudarte a encontrar rincones especiales de Colombia. Cuando quieras seguimos planeando. ¿Hay algún otro lugar que te dé curiosidad?", fuentes:[]};
  }
  if (/adios|hasta luego|chao|nos vemos/.test(q)) {
    return {texto:"¡Hasta pronto, viajero/a! 🌙 Que nunca te falten caminos por descubrir. Aquí estaré cuando quieras seguir explorando Colombia.", fuentes:[]};
  }
  if (/que puedes hacer|en que me puedes ayudar|como puedes ayudar|que sabes hacer|ayudame/.test(q)) {
    return {texto:"Puedo ayudarte a descubrir destinos colombianos y darte ideas según tus gustos. Por ejemplo, puedo recomendarte playas, pueblos, lugares de naturaleza o aventura; contarte qué visitar en una ciudad o departamento; y sugerirte planes según el tipo de viaje que imaginas.\n\nPuedes empezar diciéndome: «Quiero un viaje tranquilo», «Me gustan los pueblos» o «¿Qué puedo visitar en Antioquia?». ✧", fuentes:[]};
  }

  // Si la persona acepta una recomendación, Brújula inicia el pequeño viaje.
  if (destinoPendiente && /^(si|claro|vale|acepto|me gusta|me encanta|vamos|de una|hagamoslo|quiero ir|ese|esa|perfecto|listo)(\b|\s|!|\.)/.test(q)) {
    const elegido = destinoPendiente;
    destinoPendiente = null;
    return {texto:`¡Yujuuu! 💌 Entonces nuestro próximo destino será ${elegido.nombre}, en ${elegido.depto}.

✈️ ¡Que comience esta aventura! Guarda esta pequeña ruta en tu corazón y revisa la fuente oficial para preparar tu visita.`, fuentes:[elegido], efecto:"viaje"};
  }

  // Consulta por lugar o departamento: prioriza coincidencias con el nombre del destino.
  const coincidencias = destinos.map(d => {
    const nombre = normalizar(d.nombre);
    const depto = normalizar(d.depto);
    const campos = [d.nombre, d.depto, d.region, ...(d.cats || []), ...(d.tags || [])];
    let puntos = 0;
    if (nombre.length > 2 && q.includes(nombre)) puntos += 12;
    if (depto.length > 2 && q.includes(depto)) puntos += 7;
    for (const campo of campos) {
      const termino = normalizar(campo);
      if (termino.length > 3 && q.includes(termino)) puntos += termino === nombre ? 0 : 1;
    }
    return {destino:d, puntos};
  }).filter(x => x.puntos > 0).sort((a,b) => b.puntos - a.puntos);

  if (coincidencias.length) {
    const elegidos = coincidencias.slice(0, 3).map(x => x.destino);
    const principal = elegidos[0];
    const quiereRecomendacion = /recomiend|que hacer|que visitar|que conocer|vale la pena|planes|plan|visitar|conocer|viajar/.test(q);
    if (elegidos.length > 1 && !q.includes(normalizar(principal.nombre))) {
      return {texto:`¡Claro! En esta zona puedes explorar ${elegidos.map(d => d.nombre).join(", ")}.\n\nPor ejemplo, ${principal.nombre}: ${principal.desc}\n\n${principal.planes.slice(0,2).join(" ")} ¿Te gustaría un plan más de naturaleza, cultura, descanso o aventura?`, fuentes:elegidos};
    }
    return {texto:`${quiereRecomendacion ? `¡Claro! Te recomiendo mirar ${principal.nombre}` : `¡Vamos a descubrir ${principal.nombre}`} (${principal.depto}). ${principal.desc}\n\nAlgunas ideas para tu visita:\n• ${principal.planes.slice(0,3).join("\n• ")}\n\n${quiereRecomendacion ? "Si me cuentas qué tipo de experiencia buscas, puedo sugerirte otros lugares parecidos." : "¿Quieres que te recomiende actividades o lugares cercanos?"}`, fuentes:[principal]};
  }

  const porCategoria = recomendarPorPreferencia(q);
  if (porCategoria) return porCategoria;

  const regiones = ["Caribe","Andina","Pacífica","Amazonía","Orinoquía"];
  const region = regiones.find(r => q.includes(normalizar(r)));
  if (region) {
    const encontrados = destinos.filter(d => d.region === region).slice(0,3);
    if (encontrados.length) return {texto:`¡La región ${region} tiene mucho por descubrir! Puedes comenzar por ${encontrados.map(d => d.nombre).join(", ")}.\n\nTe cuento un poquito: ${encontrados[0].desc}\n\n¿Te interesa más la naturaleza, la cultura o un plan de descanso?`, fuentes:encontrados};
  }

  if (/recomiend|que lugar|donde puedo|a donde|que destino|no se a donde|sorprendeme|cualquier lugar/.test(q)) {
    const elegidos = ["naturaleza", "playa", "historia"].map(cat => destinos.find(d => (d.cats || []).includes(cat))).filter(Boolean);
    return {texto:`¡Me encanta ayudarte a elegir! ✨ Si todavía no tienes un lugar en mente, podemos empezar con tres estilos distintos: ${elegidos.map(d => `${d.nombre} (${d.depto})`).join(", ")}.\n\nCuéntame qué paisaje te llama más: ¿mar, montaña, selva o un pueblo lleno de historia? También puedes decirme si buscas descanso o aventura.`, fuentes:elegidos};
  }
  return null;
}

async function enviarPregunta(pregunta) {
  const texto = (pregunta || "").trim();
  if (!texto || sendButton.disabled) return;
  lastQuestion = texto;
  agregarMensaje(texto, "user");
  input.value = "";
  input.style.height = "auto";
  sendButton.disabled = true;
  input.disabled = true;
  mostrarEspera();
  await new Promise(resolve => setTimeout(resolve, 850));
  const resultado = buscarRespuesta(texto);
  quitarEspera();
  if (resultado) {
    if (resultado.fuentes?.length && resultado.efecto !== "viaje") destinoPendiente = resultado.fuentes[0];
    agregarRespuesta(resultado.texto, resultado.fuentes || [], false, resultado.efecto || "");
  }
  else agregarRespuesta("¡Me encantaría ayudarte con eso! 🌷 Por ahora no encuentro información suficiente en mi atlas para responder con seguridad. Puedes preguntarme por un destino colombiano, una ciudad, un departamento, una región o por recomendaciones de playas, naturaleza, pueblos y aventura. También puedes reformular tu pregunta.", [], true);
  sendButton.disabled = false;
  input.disabled = false;
  input.focus();
}

form.addEventListener("submit", e => { e.preventDefault(); enviarPregunta(input.value); });
document.querySelectorAll("[data-question]").forEach(b => b.addEventListener("click", () => enviarPregunta(b.dataset.question)));
document.getElementById("newChat").addEventListener("click", () => {
  messages.innerHTML = `<div class="message-row bot-row"><div class="message-avatar">✳</div><div class="message-content"><div class="bubble bot-bubble">¡Hola de nuevo! 🌙 Tengo el mapa listo. ¿Qué rincón de Colombia te gustaría descubrir ahora? ¿En qué te puedo ayudar?</div>${avisoLimites()}</div></div>`;
  lastQuestion = "";
  destinoPendiente = null;
  input.value = "";
  input.focus();
});
input.addEventListener("input", () => { input.style.height = "auto"; input.style.height = Math.min(input.scrollHeight, 110) + "px"; });
input.addEventListener("keydown", e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); form.requestSubmit(); } });
cargarDestinos();
