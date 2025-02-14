export const corsOptions = {
  origin: 'http://localhost:4000/', // Apenas essa origem pode acessar
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
