const fastify = require('fastify')({ logger: true });
const cors = require('@fastify/cors');
const jwt = require('@fastify/jwt');
const websocket = require('@fastify/websocket');

// Configuration des plugins
fastify.register(cors, {
  origin: process.env.NODE_ENV === 'production' 
    ? 'https://votre-domaine.com' 
    : 'http://localhost:8080'
});

fastify.register(jwt, {
  secret: process.env.JWT_SECRET || 'votre-secret-jwt'
});

fastify.register(websocket);

// Route de test
fastify.get('/', async (request, reply) => {
  return { message: 'Bienvenue sur l\'API ft_transcendence' };
});

// Démarrage du serveur
const start = async () => {
  try {
    await fastify.listen({ port: 3000, host: '0.0.0.0' });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start(); 