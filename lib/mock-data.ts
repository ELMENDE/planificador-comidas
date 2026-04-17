import type { MenuSemanal, Receta } from '@/types/menu'

/**
 * Menu semanal predefinido para modo mock.
 * 21 recetas con ingredientes que se repiten entre dias — esto permite
 * testear la consolidacion real de la lista de compras sin gastar tokens.
 */

function r(
  nombre:         string,
  tipo:           Receta['tipo_comida'],
  descripcion:    string,
  tiempo_minutos: number,
  calorias:       number,
  ingredientes:   Receta['ingredientes'],
  pasos:          string[],
  tags:           string[],
): Receta {
  return {
    nombre,
    tipo_comida: tipo,
    descripcion,
    tiempo_minutos,
    calorias,
    porciones: 2,
    ingredientes,
    pasos: pasos.map((p, i) => ({ numero: i + 1, descripcion: p })),
    tags,
  }
}

// --- Desayunos ---
const tostadasPalta = r(
  'Tostadas con palta y huevo',
  'desayuno',
  'Pan integral tostado con palta pisada y huevo frito.',
  10, 380,
  [
    { nombre: 'pan integral', cantidad: 4, unidad: 'unid', categoria: 'panaderia' },
    { nombre: 'palta',        cantidad: 1, unidad: 'unid', categoria: 'frutas' },
    { nombre: 'huevo',        cantidad: 2, unidad: 'unid', categoria: 'proteinas' },
    { nombre: 'sal',          cantidad: 1, unidad: 'cdita', categoria: 'condimentos' },
  ],
  [
    'Tostar el pan.',
    'Pisar la palta con sal.',
    'Freir el huevo en una sarten.',
    'Servir la palta sobre el pan y coronar con el huevo.',
  ],
  ['rapido', 'vegetariano'],
)

const yogurGranola = r(
  'Yogur con granola y frutas',
  'desayuno',
  'Yogur natural con granola casera y frutas de estacion.',
  5, 320,
  [
    { nombre: 'yogur natural', cantidad: 400, unidad: 'g',   categoria: 'lacteos' },
    { nombre: 'granola',       cantidad: 100, unidad: 'g',   categoria: 'almacen' },
    { nombre: 'banana',        cantidad: 2,   unidad: 'unid', categoria: 'frutas' },
    { nombre: 'miel',          cantidad: 2,   unidad: 'cda',  categoria: 'condimentos' },
  ],
  ['Servir el yogur en un bowl.', 'Agregar la granola.', 'Cortar la banana en rodajas y sumarla.', 'Rociar con miel.'],
  ['rapido', 'vegetariano'],
)

const mediasLunas = r(
  'Cafe con medialunas y queso',
  'desayuno',
  'Desayuno clasico uruguayo.',
  8, 420,
  [
    { nombre: 'medialunas',    cantidad: 4,   unidad: 'unid', categoria: 'panaderia' },
    { nombre: 'queso dambo',   cantidad: 100, unidad: 'g',    categoria: 'lacteos' },
    { nombre: 'cafe',          cantidad: 2,   unidad: 'taza', categoria: 'almacen' },
    { nombre: 'leche',         cantidad: 200, unidad: 'ml',   categoria: 'lacteos' },
  ],
  ['Calentar las medialunas 2 minutos en el horno.', 'Preparar el cafe con leche.', 'Servir con el queso.'],
  ['rapido', 'vegetariano'],
)

const avena = r(
  'Avena con banana',
  'desayuno',
  'Porridge de avena con banana y canela.',
  10, 350,
  [
    { nombre: 'avena',   cantidad: 100, unidad: 'g',    categoria: 'almacen' },
    { nombre: 'leche',   cantidad: 400, unidad: 'ml',   categoria: 'lacteos' },
    { nombre: 'banana',  cantidad: 1,   unidad: 'unid', categoria: 'frutas' },
    { nombre: 'canela',  cantidad: 1,   unidad: 'cdita', categoria: 'condimentos' },
    { nombre: 'miel',    cantidad: 1,   unidad: 'cda',   categoria: 'condimentos' },
  ],
  ['Calentar la leche con la avena.', 'Cocinar 5 minutos revolviendo.', 'Agregar canela y servir con banana y miel.'],
  ['rapido', 'vegetariano'],
)

const tortillaVeg = r(
  'Tortilla de acelga',
  'desayuno',
  'Tortilla liviana con acelga y queso.',
  15, 340,
  [
    { nombre: 'huevo',       cantidad: 4,   unidad: 'unid', categoria: 'proteinas' },
    { nombre: 'acelga',      cantidad: 200, unidad: 'g',    categoria: 'verduras' },
    { nombre: 'queso dambo', cantidad: 80,  unidad: 'g',    categoria: 'lacteos' },
    { nombre: 'aceite',      cantidad: 2,   unidad: 'cda',  categoria: 'condimentos' },
    { nombre: 'sal',         cantidad: 1,   unidad: 'cdita', categoria: 'condimentos' },
  ],
  ['Saltear la acelga.', 'Batir los huevos con sal.', 'Mezclar con la acelga y el queso.', 'Cocinar en sarten de ambos lados.'],
  ['vegetariano'],
)

const smoothieBowl = r(
  'Smoothie bowl de frutilla',
  'desayuno',
  'Bowl frio con frutilla, banana y granola.',
  7, 310,
  [
    { nombre: 'frutilla',      cantidad: 200, unidad: 'g',    categoria: 'frutas' },
    { nombre: 'banana',        cantidad: 1,   unidad: 'unid', categoria: 'frutas' },
    { nombre: 'yogur natural', cantidad: 200, unidad: 'g',    categoria: 'lacteos' },
    { nombre: 'granola',       cantidad: 60,  unidad: 'g',    categoria: 'almacen' },
  ],
  ['Licuar frutilla, banana y yogur.', 'Servir en bowl.', 'Coronar con granola.'],
  ['rapido', 'vegetariano'],
)

const panQueso = r(
  'Tostadas con queso y tomate',
  'desayuno',
  'Tostadas con queso derretido y tomate fresco.',
  8, 360,
  [
    { nombre: 'pan integral', cantidad: 4,  unidad: 'unid', categoria: 'panaderia' },
    { nombre: 'queso dambo',  cantidad: 100, unidad: 'g',   categoria: 'lacteos' },
    { nombre: 'tomate',       cantidad: 2,  unidad: 'unid', categoria: 'verduras' },
    { nombre: 'oregano',      cantidad: 1,  unidad: 'cdita', categoria: 'condimentos' },
  ],
  ['Tostar el pan.', 'Poner el queso arriba.', 'Gratinar en horno 3 minutos.', 'Servir con tomate en rodajas y oregano.'],
  ['rapido', 'vegetariano'],
)

// --- Almuerzos ---
const pastaTomate = r(
  'Fideos con salsa de tomate',
  'almuerzo',
  'Fideos con salsa casera de tomate y albahaca.',
  25, 580,
  [
    { nombre: 'fideos',     cantidad: 300, unidad: 'g',    categoria: 'almacen' },
    { nombre: 'tomate',     cantidad: 4,   unidad: 'unid', categoria: 'verduras' },
    { nombre: 'cebolla',    cantidad: 1,   unidad: 'unid', categoria: 'verduras' },
    { nombre: 'ajo',        cantidad: 2,   unidad: 'unid', categoria: 'verduras' },
    { nombre: 'queso rallado', cantidad: 50, unidad: 'g',  categoria: 'lacteos' },
    { nombre: 'aceite',     cantidad: 3,   unidad: 'cda',  categoria: 'condimentos' },
  ],
  ['Hervir agua con sal y cocinar los fideos.', 'Picar cebolla y ajo, sofreir.', 'Agregar tomate picado.', 'Cocinar 15 minutos.', 'Servir sobre los fideos con queso rallado.'],
  ['vegetariano', 'italiana'],
)

const milanesaPure = r(
  'Milanesa con pure',
  'almuerzo',
  'Milanesa de carne con pure de papa casero.',
  40, 720,
  [
    { nombre: 'carne para milanesa', cantidad: 400, unidad: 'g',   categoria: 'proteinas' },
    { nombre: 'huevo',               cantidad: 2,   unidad: 'unid', categoria: 'proteinas' },
    { nombre: 'pan rallado',         cantidad: 200, unidad: 'g',   categoria: 'almacen' },
    { nombre: 'papa',                cantidad: 600, unidad: 'g',   categoria: 'verduras' },
    { nombre: 'leche',               cantidad: 100, unidad: 'ml',  categoria: 'lacteos' },
    { nombre: 'manteca',             cantidad: 30,  unidad: 'g',   categoria: 'lacteos' },
    { nombre: 'aceite',              cantidad: 100, unidad: 'ml',  categoria: 'condimentos' },
  ],
  ['Pasar la carne por huevo y pan rallado.', 'Freir en aceite caliente.', 'Hervir las papas.', 'Pisar con leche y manteca.', 'Servir caliente.'],
  ['criolla'],
)

const ensaladaPollo = r(
  'Ensalada con pollo grillado',
  'almuerzo',
  'Ensalada verde con pollo a la plancha y palta.',
  25, 450,
  [
    { nombre: 'pechuga de pollo', cantidad: 400, unidad: 'g',   categoria: 'proteinas' },
    { nombre: 'lechuga',          cantidad: 1,   unidad: 'unid', categoria: 'verduras' },
    { nombre: 'tomate',           cantidad: 2,   unidad: 'unid', categoria: 'verduras' },
    { nombre: 'palta',            cantidad: 1,   unidad: 'unid', categoria: 'frutas' },
    { nombre: 'limon',            cantidad: 1,   unidad: 'unid', categoria: 'frutas' },
    { nombre: 'aceite',           cantidad: 2,   unidad: 'cda',  categoria: 'condimentos' },
  ],
  ['Grillar el pollo con sal.', 'Lavar y cortar la lechuga y el tomate.', 'Cortar la palta.', 'Mezclar todo.', 'Aderezar con aceite y limon.'],
  ['saludable'],
)

const arrozSalteado = r(
  'Arroz salteado con verduras',
  'almuerzo',
  'Arroz integral salteado con morron, zanahoria y huevo.',
  30, 520,
  [
    { nombre: 'arroz',    cantidad: 250, unidad: 'g',    categoria: 'almacen' },
    { nombre: 'zanahoria', cantidad: 2,  unidad: 'unid', categoria: 'verduras' },
    { nombre: 'morron',   cantidad: 1,   unidad: 'unid', categoria: 'verduras' },
    { nombre: 'huevo',    cantidad: 2,   unidad: 'unid', categoria: 'proteinas' },
    { nombre: 'salsa de soja', cantidad: 3, unidad: 'cda', categoria: 'condimentos' },
    { nombre: 'aceite',   cantidad: 2,   unidad: 'cda',  categoria: 'condimentos' },
  ],
  ['Hervir el arroz.', 'Picar las verduras chiquitas.', 'Saltear en wok con aceite.', 'Agregar el arroz y la salsa de soja.', 'Sumar el huevo revuelto al final.'],
  ['vegetariano', 'asiatica'],
)

const tartaCalabaza = r(
  'Tarta de calabaza y queso',
  'almuerzo',
  'Tarta con calabaza asada y queso azul.',
  45, 560,
  [
    { nombre: 'masa para tarta', cantidad: 2,   unidad: 'unid', categoria: 'panaderia' },
    { nombre: 'calabaza',        cantidad: 500, unidad: 'g',    categoria: 'verduras' },
    { nombre: 'queso dambo',     cantidad: 150, unidad: 'g',    categoria: 'lacteos' },
    { nombre: 'huevo',           cantidad: 3,   unidad: 'unid', categoria: 'proteinas' },
    { nombre: 'cebolla',         cantidad: 1,   unidad: 'unid', categoria: 'verduras' },
  ],
  ['Asar la calabaza 20 minutos.', 'Saltear la cebolla.', 'Batir huevos con el queso.', 'Rellenar la tarta.', 'Horno 25 minutos a 180°C.'],
  ['vegetariano'],
)

const wrapsPollo = r(
  'Wraps de pollo y palta',
  'almuerzo',
  'Tortillas rellenas con pollo, palta y verduras.',
  20, 510,
  [
    { nombre: 'tortillas de trigo', cantidad: 4, unidad: 'unid', categoria: 'panaderia' },
    { nombre: 'pechuga de pollo',   cantidad: 300, unidad: 'g',  categoria: 'proteinas' },
    { nombre: 'palta',              cantidad: 1,   unidad: 'unid', categoria: 'frutas' },
    { nombre: 'lechuga',            cantidad: 1,   unidad: 'unid', categoria: 'verduras' },
    { nombre: 'tomate',             cantidad: 1,   unidad: 'unid', categoria: 'verduras' },
    { nombre: 'mayonesa',           cantidad: 2,   unidad: 'cda',  categoria: 'condimentos' },
  ],
  ['Grillar el pollo y cortar en tiras.', 'Calentar las tortillas.', 'Armar con lechuga, tomate, palta, pollo y mayonesa.', 'Enrollar.'],
  ['rapido'],
)

const ravioles = r(
  'Ravioles con salsa fileto',
  'almuerzo',
  'Ravioles de ricota con salsa de tomate.',
  20, 620,
  [
    { nombre: 'ravioles',      cantidad: 500, unidad: 'g',   categoria: 'almacen' },
    { nombre: 'tomate',        cantidad: 3,   unidad: 'unid', categoria: 'verduras' },
    { nombre: 'ajo',           cantidad: 2,   unidad: 'unid', categoria: 'verduras' },
    { nombre: 'albahaca',      cantidad: 1,   unidad: 'cda',  categoria: 'condimentos' },
    { nombre: 'queso rallado', cantidad: 50,  unidad: 'g',    categoria: 'lacteos' },
    { nombre: 'aceite',        cantidad: 2,   unidad: 'cda',  categoria: 'condimentos' },
  ],
  ['Hacer la salsa con tomate, ajo y aceite.', 'Hervir los ravioles.', 'Servir con la salsa y queso.'],
  ['italiana', 'vegetariano'],
)

// --- Cenas ---
const sopaVerduras = r(
  'Sopa de verduras',
  'cena',
  'Sopa casera con zanahoria, zapallo y puerro.',
  30, 280,
  [
    { nombre: 'zanahoria', cantidad: 2,   unidad: 'unid', categoria: 'verduras' },
    { nombre: 'calabaza',  cantidad: 300, unidad: 'g',    categoria: 'verduras' },
    { nombre: 'cebolla',   cantidad: 1,   unidad: 'unid', categoria: 'verduras' },
    { nombre: 'papa',      cantidad: 2,   unidad: 'unid', categoria: 'verduras' },
    { nombre: 'caldo de verduras', cantidad: 1, unidad: 'l', categoria: 'almacen' },
  ],
  ['Picar todas las verduras.', 'Hervir con el caldo 25 minutos.', 'Licuar y servir.'],
  ['vegetariano', 'saludable'],
)

const pescadoHorno = r(
  'Merluza al horno con papas',
  'cena',
  'Filetes de merluza con papas al horno y limon.',
  35, 480,
  [
    { nombre: 'merluza',  cantidad: 400, unidad: 'g',    categoria: 'proteinas' },
    { nombre: 'papa',     cantidad: 500, unidad: 'g',    categoria: 'verduras' },
    { nombre: 'limon',    cantidad: 1,   unidad: 'unid', categoria: 'frutas' },
    { nombre: 'ajo',      cantidad: 2,   unidad: 'unid', categoria: 'verduras' },
    { nombre: 'aceite',   cantidad: 3,   unidad: 'cda',  categoria: 'condimentos' },
    { nombre: 'perejil',  cantidad: 1,   unidad: 'cda',  categoria: 'condimentos' },
  ],
  ['Cortar las papas en rodajas finas.', 'Disponer en fuente con aceite y sal.', 'Horno 180°C por 20 minutos.', 'Agregar la merluza con ajo y limon.', 'Cocinar 15 minutos mas.'],
  ['saludable'],
)

const pizzaCasera = r(
  'Pizza casera de muzzarella',
  'cena',
  'Pizza con masa casera, salsa y muzzarella.',
  45, 780,
  [
    { nombre: 'harina',           cantidad: 400, unidad: 'g', categoria: 'almacen' },
    { nombre: 'levadura',         cantidad: 10,  unidad: 'g', categoria: 'almacen' },
    { nombre: 'tomate',           cantidad: 3,   unidad: 'unid', categoria: 'verduras' },
    { nombre: 'muzzarella',       cantidad: 300, unidad: 'g',   categoria: 'lacteos' },
    { nombre: 'aceite',           cantidad: 2,   unidad: 'cda', categoria: 'condimentos' },
    { nombre: 'oregano',          cantidad: 1,   unidad: 'cda', categoria: 'condimentos' },
  ],
  ['Hacer la masa y dejar leudar 30 min.', 'Estirar en la pizzera.', 'Cubrir con salsa de tomate y muzzarella.', 'Horno maximo 12 minutos.', 'Terminar con oregano.'],
  ['vegetariano', 'italiana'],
)

const hamburguesasCaseras = r(
  'Hamburguesas caseras con ensalada',
  'cena',
  'Hamburguesas de carne picada con ensalada simple.',
  25, 640,
  [
    { nombre: 'carne picada', cantidad: 400, unidad: 'g',    categoria: 'proteinas' },
    { nombre: 'pan de hamburguesa', cantidad: 4, unidad: 'unid', categoria: 'panaderia' },
    { nombre: 'lechuga',      cantidad: 1,   unidad: 'unid', categoria: 'verduras' },
    { nombre: 'tomate',       cantidad: 2,   unidad: 'unid', categoria: 'verduras' },
    { nombre: 'queso dambo',  cantidad: 100, unidad: 'g',    categoria: 'lacteos' },
    { nombre: 'cebolla',      cantidad: 1,   unidad: 'unid', categoria: 'verduras' },
  ],
  ['Formar 4 hamburguesas con la carne.', 'Cocinar en sarten 4 min por lado.', 'Tostar los panes.', 'Armar con lechuga, tomate, queso y cebolla.'],
  ['criolla'],
)

const risotto = r(
  'Risotto de hongos',
  'cena',
  'Risotto cremoso con hongos y queso parmesano.',
  40, 590,
  [
    { nombre: 'arroz',         cantidad: 250, unidad: 'g',    categoria: 'almacen' },
    { nombre: 'hongos',        cantidad: 300, unidad: 'g',    categoria: 'verduras' },
    { nombre: 'cebolla',       cantidad: 1,   unidad: 'unid', categoria: 'verduras' },
    { nombre: 'caldo de verduras', cantidad: 1, unidad: 'l',  categoria: 'almacen' },
    { nombre: 'queso rallado', cantidad: 80,  unidad: 'g',    categoria: 'lacteos' },
    { nombre: 'manteca',       cantidad: 40,  unidad: 'g',    categoria: 'lacteos' },
  ],
  ['Saltear la cebolla.', 'Agregar el arroz y tostar.', 'Sumar hongos y caldo de a poco.', 'Revolver 18 minutos.', 'Terminar con manteca y queso.'],
  ['italiana', 'vegetariano'],
)

const guisoLentejas = r(
  'Guiso de lentejas',
  'cena',
  'Guiso criollo de lentejas con verduras y chorizo.',
  45, 650,
  [
    { nombre: 'lentejas',   cantidad: 300, unidad: 'g',    categoria: 'almacen' },
    { nombre: 'chorizo',    cantidad: 200, unidad: 'g',    categoria: 'proteinas' },
    { nombre: 'zanahoria',  cantidad: 2,   unidad: 'unid', categoria: 'verduras' },
    { nombre: 'cebolla',    cantidad: 1,   unidad: 'unid', categoria: 'verduras' },
    { nombre: 'morron',     cantidad: 1,   unidad: 'unid', categoria: 'verduras' },
    { nombre: 'papa',       cantidad: 2,   unidad: 'unid', categoria: 'verduras' },
    { nombre: 'caldo de verduras', cantidad: 1, unidad: 'l', categoria: 'almacen' },
  ],
  ['Remojar las lentejas.', 'Sofreir cebolla, morron y zanahoria.', 'Agregar chorizo en rodajas.', 'Sumar lentejas, papa y caldo.', 'Cocinar 35 minutos.'],
  ['criolla'],
)

const omeletteQueso = r(
  'Omelette de queso y espinaca',
  'cena',
  'Omelette liviana con queso y espinaca salteada.',
  15, 380,
  [
    { nombre: 'huevo',       cantidad: 4,   unidad: 'unid', categoria: 'proteinas' },
    { nombre: 'espinaca',    cantidad: 200, unidad: 'g',    categoria: 'verduras' },
    { nombre: 'queso dambo', cantidad: 100, unidad: 'g',    categoria: 'lacteos' },
    { nombre: 'manteca',     cantidad: 20,  unidad: 'g',    categoria: 'lacteos' },
  ],
  ['Saltear la espinaca.', 'Batir los huevos.', 'Cocinar en sarten con manteca.', 'Agregar queso y espinaca.', 'Doblar y servir.'],
  ['vegetariano', 'rapido'],
)

export const MOCK_MENU: MenuSemanal = {
  id:         'mock-menu-v1',
  generadoAt: new Date().toISOString(),
  dias: [
    { dia: 'Lunes',     desayuno: tostadasPalta, almuerzo: pastaTomate,   cena: sopaVerduras       },
    { dia: 'Martes',    desayuno: yogurGranola,  almuerzo: milanesaPure,  cena: pescadoHorno       },
    { dia: 'Miercoles', desayuno: mediasLunas,   almuerzo: ensaladaPollo, cena: pizzaCasera        },
    { dia: 'Jueves',    desayuno: avena,         almuerzo: arrozSalteado, cena: hamburguesasCaseras },
    { dia: 'Viernes',   desayuno: tortillaVeg,   almuerzo: tartaCalabaza, cena: risotto            },
    { dia: 'Sabado',    desayuno: smoothieBowl,  almuerzo: wrapsPollo,    cena: guisoLentejas      },
    { dia: 'Domingo',   desayuno: panQueso,      almuerzo: ravioles,      cena: omeletteQueso      },
  ],
}

/**
 * Pool de alternativas para el reemplazo en modo mock.
 * Devuelve una receta distinta a la actual, del mismo tipo.
 */
const POOL_DESAYUNO: Receta[] = [
  r(
    'Panqueques con dulce de leche',
    'desayuno',
    'Panqueques finos con dulce de leche.',
    15, 450,
    [
      { nombre: 'harina',         cantidad: 200, unidad: 'g',  categoria: 'almacen' },
      { nombre: 'leche',          cantidad: 400, unidad: 'ml', categoria: 'lacteos' },
      { nombre: 'huevo',          cantidad: 2,   unidad: 'unid', categoria: 'proteinas' },
      { nombre: 'dulce de leche', cantidad: 200, unidad: 'g',  categoria: 'almacen' },
    ],
    ['Mezclar harina, leche y huevo.', 'Cocinar en sarten.', 'Rellenar con dulce de leche.'],
    ['vegetariano'],
  ),
  r(
    'Fruta con queso cottage',
    'desayuno',
    'Bowl de fruta fresca con queso cottage.',
    5, 280,
    [
      { nombre: 'queso cottage', cantidad: 200, unidad: 'g',  categoria: 'lacteos' },
      { nombre: 'manzana',       cantidad: 1,   unidad: 'unid', categoria: 'frutas' },
      { nombre: 'banana',        cantidad: 1,   unidad: 'unid', categoria: 'frutas' },
      { nombre: 'miel',          cantidad: 1,   unidad: 'cda', categoria: 'condimentos' },
    ],
    ['Cortar las frutas.', 'Servir con queso cottage.', 'Rociar con miel.'],
    ['rapido', 'vegetariano', 'saludable'],
  ),
]

const POOL_ALMUERZO: Receta[] = [
  r(
    'Pollo al curry con arroz',
    'almuerzo',
    'Pollo en salsa de curry suave con arroz blanco.',
    35, 610,
    [
      { nombre: 'pechuga de pollo', cantidad: 400, unidad: 'g', categoria: 'proteinas' },
      { nombre: 'arroz',            cantidad: 250, unidad: 'g', categoria: 'almacen' },
      { nombre: 'leche de coco',    cantidad: 400, unidad: 'ml', categoria: 'almacen' },
      { nombre: 'curry en polvo',   cantidad: 2,   unidad: 'cda', categoria: 'condimentos' },
      { nombre: 'cebolla',          cantidad: 1,   unidad: 'unid', categoria: 'verduras' },
    ],
    ['Dorar el pollo cortado.', 'Agregar cebolla y curry.', 'Sumar leche de coco.', 'Cocinar 20 minutos.', 'Servir con arroz.'],
    ['asiatica'],
  ),
  r(
    'Ensalada cesar',
    'almuerzo',
    'Ensalada cesar clasica con croutons.',
    20, 490,
    [
      { nombre: 'pechuga de pollo', cantidad: 300, unidad: 'g', categoria: 'proteinas' },
      { nombre: 'lechuga',          cantidad: 1,   unidad: 'unid', categoria: 'verduras' },
      { nombre: 'pan integral',     cantidad: 2,   unidad: 'unid', categoria: 'panaderia' },
      { nombre: 'queso rallado',    cantidad: 50,  unidad: 'g',    categoria: 'lacteos' },
      { nombre: 'mayonesa',         cantidad: 3,   unidad: 'cda',  categoria: 'condimentos' },
    ],
    ['Cortar el pan en cubos y tostar.', 'Grillar el pollo.', 'Mezclar con lechuga y aderezo.'],
    ['rapido'],
  ),
]

const POOL_CENA: Receta[] = [
  r(
    'Tacos de carne',
    'cena',
    'Tacos mexicanos con carne picada especiada.',
    25, 580,
    [
      { nombre: 'carne picada',       cantidad: 400, unidad: 'g', categoria: 'proteinas' },
      { nombre: 'tortillas de trigo', cantidad: 6,   unidad: 'unid', categoria: 'panaderia' },
      { nombre: 'cebolla',            cantidad: 1,   unidad: 'unid', categoria: 'verduras' },
      { nombre: 'tomate',             cantidad: 2,   unidad: 'unid', categoria: 'verduras' },
      { nombre: 'queso dambo',        cantidad: 100, unidad: 'g',    categoria: 'lacteos' },
      { nombre: 'comino',             cantidad: 1,   unidad: 'cdita', categoria: 'condimentos' },
    ],
    ['Dorar la carne con cebolla y comino.', 'Calentar las tortillas.', 'Armar con carne, tomate y queso.'],
    ['mexicana'],
  ),
  r(
    'Zapallitos rellenos',
    'cena',
    'Zapallitos rellenos con carne y verduras.',
    50, 520,
    [
      { nombre: 'zapallito', cantidad: 4,   unidad: 'unid', categoria: 'verduras' },
      { nombre: 'carne picada', cantidad: 300, unidad: 'g', categoria: 'proteinas' },
      { nombre: 'cebolla',   cantidad: 1,   unidad: 'unid', categoria: 'verduras' },
      { nombre: 'queso dambo', cantidad: 100, unidad: 'g', categoria: 'lacteos' },
      { nombre: 'huevo',     cantidad: 1,   unidad: 'unid', categoria: 'proteinas' },
    ],
    ['Hervir los zapallitos 10 minutos.', 'Vaciar el centro.', 'Mezclar la pulpa con carne salteada y huevo.', 'Rellenar y gratinar con queso 15 min.'],
    ['criolla'],
  ),
]

export function mockReemplazo(
  tipo: Receta['tipo_comida'],
  actual: Receta,
  otrasDelDia: Receta[],
): Receta {
  const pool = {
    desayuno: POOL_DESAYUNO,
    almuerzo: POOL_ALMUERZO,
    cena:     POOL_CENA,
  }[tipo]

  const evitar = new Set([actual.nombre, ...otrasDelDia.map(r => r.nombre)])
  const candidato = pool.find(r => !evitar.has(r.nombre)) ?? pool[0]
  return { ...candidato, id: `mock-${Date.now()}` }
}
