# สเต็ป 1: โหลด Node.js มาเพื่อ Build โค้ด React
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# สเต็ป 2: โหลด Nginx มาเพื่อทำหน้าที่เปิดหน้าเว็บ
FROM nginx:alpine

# ⚠️ จุดสำคัญ: ถ้าโปรเจคคุณใช้ Vite ให้แก้จาก /app/build เป็น /app/dist นะครับ
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]