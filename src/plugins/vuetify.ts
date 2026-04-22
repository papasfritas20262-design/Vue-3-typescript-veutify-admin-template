import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import '@mdi/font/css/materialdesignicons.css'

export default createVuetify({
  components,
  directives,
  theme: {
    defaultTheme: 'light',
    themes: {
      light: {
        colors: {
          primary: '#846230',     // Verde principal - Naturaleza
          secondary: '#558B2F',   // Verde oliva - soporte
          accent: '#A5D6A7',      // Verde suave - contraste
          error: '#E53935',       // Rojo cálido
          info: '#039BE5',        // Azul brillante
          success: '#43A047',     // Verde éxito
          warning: '#FB8C00',     // Naranja brillante
          background: '#F9FAF9',  // Fondo neutro claro
        }
      },
    },
  },
})
