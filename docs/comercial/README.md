# Lokebox Quote: Frente Comercial

**Estado:** activo  
**Inicio:** 11/09/2026  
**Propósito:** fuente de verdad comercial de Lokebox Quote.  

Este directorio documenta producto comercial, posicionamiento, pricing, canales, Upwork, prospección, aprendizaje de mercado y decisiones de venta.

La arquitectura, implementación y ejecución técnica se documentan en los archivos técnicos existentes del repositorio (`SPEC.md`, `docs/STATE.md`, `docs/DECISIONES.md`, etc.). Este frente solo entra en decisiones técnicas cuando afectan producto, precio, costos, entrega o venta.

---

## 1. Rol de Lokebox Quote dentro de Lokebox

Lokebox Quote **no reemplaza a Lokebox ni representa un pivot del negocio principal**.

Lokebox sigue siendo una empresa orientada a automatización de procesos administrativos y comerciales mediante software, integraciones, herramientas internas e IA cuando aporte valor.

Lokebox Quote funciona como **wedge comercial**: un producto visual, fácil de mostrar y comprar, pensado para generar primeras ventas, conversaciones, casos, reputación y oportunidades de implementación más profundas.

Modelo conceptual:

**WOW visual → configurador → quote/lead → WhatsApp/email/web inquiry → procesamiento IA → automatización comercial → implementación Lokebox**

La parte visual consigue atención. La cotización estructurada es el producto inmediato. La automatización posterior es donde Lokebox puede ampliar valor y ticket.

---

## 2. Producto inicial

### Nombre

**Lokebox Quote**

### Primera vertical

**Signage / cartelería**

El foco inicial son productos visuales y personalizados difíciles de vender o cotizar online, empezando por cartelería.

Experiencia esperada:

1. El negocio comparte una URL o conecta el cotizador desde su sitio.
2. El cliente configura un cartel.
3. Visualiza una representación interactiva/3D.
4. Selecciona tipo, material, iluminación, medidas, colores, montaje y otras opciones.
5. Ve precio estimado, rango o referencia de precio según el modelo del negocio.
6. Deja sus datos y solicita cotización.
7. El negocio recibe un lead estructurado con la configuración.
8. Puede generarse un resumen/quote imprimible.

No se vende principalmente como "una página web" ni como "desarrollo Three.js".

### Propuesta de valor

> Lokebox Quote convierte productos difíciles de cotizar online en experiencias interactivas donde el cliente configura, visualiza y solicita una cotización.

Problemas que busca reducir:

- consultas vagas tipo "¿cuánto sale un cartel?";
- ida y vuelta para obtener medidas, material, iluminación y montaje;
- dificultad del comprador para imaginar el producto terminado;
- tiempo invertido en leads poco calificados;
- lentitud para pasar de consulta a presupuesto;
- información comercial dispersa en WhatsApp, email y formularios.

---

## 3. Hipótesis de entrada visual

### Photo-to-Sign / Storefront Preview

Oferta/gatillo comercial:

> El cliente manda una foto de su local y ve cómo quedaría el cartel colocado sobre la fachada.

Posibles roles:

- demo WOW para outreach;
- microservicio de entrada;
- add-on de Lokebox Quote;
- herramienta de cierre de ventas para el cartelero;
- futura función integrada.

No es obligatorio que forme parte del MVP técnico inicial.

La hipótesis comercial es que puede ser más fácil iniciar una conversación mostrando un before/after visual que explicando un configurador, CPQ o motor de cotización.

---

## 4. ICP inicial

Primera hipótesis:

- empresas pequeñas/medianas de cartelería;
- letras corpóreas / channel letters;
- carteles luminosos;
- lightboxes;
- fachadas comerciales;
- productos con ticket suficiente y múltiples variables de configuración;
- negocios que hoy reciben consultas por WhatsApp, Instagram, email o formularios y cotizan manualmente.

No se busca cubrir todo signage desde el día uno.

El primer caso debe ser suficientemente específico para que el prospecto piense inmediatamente: **"esto es para mi negocio"**.

---

## 5. Modelo de ingresos

Hipótesis principal fuera de Upwork:

**setup + mensualidad**

El setup remunera implementación/configuración inicial. La mensualidad cubre la continuidad de la plataforma y permite recurrencia.

La mensualidad puede incluir:

- hosting;
- disponibilidad y monitoreo;
- mantenimiento del core;
- actualizaciones;
- soporte;
- cambios menores;
- formularios/leads;
- almacenamiento;
- analytics básicos;
- uso de IA hasta límites definidos cuando corresponda.

No vender la mensualidad simplemente como "hosting". El concepto comercial es **Lokebox Quote Platform / soporte y operación continua**.

Los límites y precio definitivo de funciones de IA se fijarán cuando se conozca su costo real de uso.

### Pricing directo

Los precios directos todavía deben validarse con outreach real. No se consideran cerrados hasta tener conversaciones con prospectos.

La intención inicial es:

- Argentina: entrada sensiblemente menor que internacional;
- internacional: setup mayor + mensualidad;
- primeros clientes: oferta "founding client" o piloto con descuento a cambio de feedback/caso comercial;
- evitar hacer un configurador completo gratis;
- evitar por ahora comisión por lead o venta.

---

## 6. Canales comerciales

### Tucumán / Argentina

Objetivo inicial: usar el mercado local como laboratorio de venta y conseguir primeros clientes pagos.

Método:

- identificar empresas reales;
- revisar web, Instagram, WhatsApp y proceso actual de cotización;
- priorizar prospectos con fit real;
- trabajar lead por lead;
- contacto por WhatsApp, Instagram, email, LinkedIn o canal disponible;
- usar demo visual personalizada cuando mejore la probabilidad de respuesta.

### Outreach internacional

Primera prioridad propuesta: Estados Unidos, particularmente sign shops independientes con productos de ticket medio/alto y proceso de quote todavía manual.

No abrir simultáneamente diez países sin haber validado mensaje y oferta.

### Upwork

Upwork es un canal de adquisición, reputación y vidriera; **no es el negocio completo**.

Situación actual:

- perfil verificado;
- 0 contratos;
- 0 reviews;
- portfolio existente orientado principalmente a Lokebox / operaciones / automatización;
- Project Catalog vacío;
- 68 Connects al 11/09/2026.

La estrategia específica está documentada en `docs/comercial/UPWORK.md`.

---

## 7. Posicionamiento

No posicionar Lokebox como agencia genérica de páginas web.

No vender Quote principalmente como:

- página web;
- Three.js development;
- WebGL development;
- un "AI product" genérico.

Posicionamiento interno:

> **Lokebox Quote is the visual sales layer of Lokebox.**

La IA puede incorporarse donde genere valor real, por ejemplo:

- interpretar una consulta escrita o por voz;
- extraer medidas y atributos;
- estructurar el pedido;
- generar un preview sobre una foto;
- crear/configurar un quote;
- devolver un link al cliente;
- enviar el lead estructurado al negocio;
- automatizar seguimiento, CRM o administración.

---

## 8. Objetivo inmediato

Lokebox Quote debe estar comercialmente listo en menos de una semana desde el 11/09/2026.

Entregables comerciales deseados:

- demo signage terminada;
- material visual fuerte (capturas + video/GIF si corresponde);
- nuevo portfolio item en Upwork;
- primer Project Catalog enviado a revisión;
- oferta directa con setup + mensualidad;
- Photo-to-Sign demostrable si llega a calidad suficiente;
- lista inicial de prospectos de Tucumán;
- lista inicial de sign shops internacionales;
- mensajes de outreach;
- primeras conversaciones medidas.

---

## 9. Regla de trabajo

Este frente busca decisiones y ejecución, no brainstorming indefinido.

Secuencia:

1. definir producto;
2. definir oferta y packaging;
3. fijar pricing de prueba;
4. definir ICP;
5. armar lista de prospectos;
6. escribir mensajes;
7. hacer outreach;
8. medir respuestas;
9. ajustar.

Las hipótesis deben distinguirse de decisiones cerradas y actualizarse con evidencia real de mercado.
