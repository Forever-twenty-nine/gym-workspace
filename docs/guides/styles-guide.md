# Styles Guide

## Estructura de estilos
En "global.css" se encuentra las importaciones de estilos necesarias en un orden establecido para que la app pueda lookearse correctamente.
En rasgos generales toma los estilos en el siguiente orden:

1. Fonts 
2. Ionic styles
3. Ionic + Angular styles para dark class
4. Variables del proyecto
5. Ajustes de Ionic styles
6. Tailwind (en este apartado podemos crear clases de tailwind si lo necesitamos)
7. Custom Styles (la idea es que esto NO exista)

Lo que podemo modificar es:

1. Fonts 

Para agregar / modificar las importaciones de fuentes

4. Variables del proyecto

Donde definiremos la paleta de colores light y dark. 
Como así también aquellas clases semánticas de componente para usarlas en el html y que sea más ordenado y limpio y no usar las variables creadas en el html.

5. Ionic Components

Es para ajustar los estilos por defecto que vienen de Ionic con sus variables para no pisar tanto. La paleta de colores se reempla en el apartado anterior. 

6. Tailwind 

Creando nuevas clases para usar en Tailwind

7. Custom Styles

La idea es que deje de existir y comenzar a enviar los estilos de este apartado a los puntos de arriba mencionados


### Variables del proyecto

Se crea la paleta de colores para usar en el tema light y dark por separado.

Luego se llama a las variables de ionic de colores.

Y por último se crean clases de componentes para tener limpieza en el código.



## Estilos en componentes Ionic

En este caso para poder pisar los estilos / variables de Ionic, es necesario si ya esta declarada antes, agregar en la clase de Tailwind un "!" antes para darle mayor peso, por ejemplo:

!text-xl
