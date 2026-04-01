# สเต็ป 1: ใช้ Node.js เวอร์ชัน 22 (เพื่อให้รองรับ Vite รุ่นใหม่)
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# สเต็ป 2: ใช้ Nginx เปิดหน้าเว็บ
FROM nginx:alpine

# แก้เป็น /app/dist เพราะ Vite จะสร้างไฟล์ไว้ที่นี่
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]