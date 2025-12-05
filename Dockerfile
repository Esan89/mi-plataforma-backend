
# Usa una imagen base de Node.js que incluya las dependencias necesarias para Puppeteer
# La imagen 'slim' es más ligera, pero necesitamos instalar Chrome manualmente o usar una imagen que ya tenga las librerías.
FROM node:20-slim

# Forzar a Node.js a usar IPv4 para evitar errores de conexión con Supabase (ENETUNREACH)
ENV NODE_OPTIONS="--dns-result-order=ipv4first"

# Instalar dependencias del sistema necesarias para Puppeteer
RUN apt-get update \
  && apt-get install -y wget gnupg \
  && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
  && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
  && apt-get update \
  && apt-get install -y google-chrome-stable fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst fonts-freefont-ttf libxss1 \
  --no-install-recommends \
  && rm -rf /var/lib/apt/lists/*

# Configurar directorio de trabajo
WORKDIR /usr/src/app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias de Node.js
# Usamos --omit=dev para producción, pero si necesitas compilar NestJS, mejor instala todo y luego limpia
RUN npm ci

# Copiar el resto del código
COPY . .

# Compilar la aplicación NestJS
RUN npm run build

# Exponer el puerto
EXPOSE 3000

# Comando de inicio
CMD ["npm", "run", "start:prod"]
