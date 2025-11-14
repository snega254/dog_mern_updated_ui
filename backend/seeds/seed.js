const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Dog = require('../models/Dog');
const Product = require('../models/Product');

const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seeding...');

    // Clear existing data
    await User.deleteMany({});
    await Dog.deleteMany({});
    await Product.deleteMany({});

    // Create sample seller
    const hashedPassword = await bcrypt.hash('seller123', 10);
    const seller = await User.create({
      name: 'Paws & Tails Store',
      email: 'seller@paws.com',
      password: hashedPassword,
      contact: '9876543210',
      userType: 'seller',
      address: {
        street: '123 Pet Street',
        city: 'Delhi',
        state: 'Delhi',
        pincode: '110001'
      }
    });

    // Create sample user
    const userPassword = await bcrypt.hash('user123', 10);
    await User.create({
      name: 'John DogLover',
      email: 'user@example.com',
      password: userPassword,
      contact: '9876543211',
      userType: 'user',
      address: {
        street: '456 Dog Lane',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400001'
      }
    });

    // Create sample dogs
    const sampleDogs = [
      {
        dogId: 'DOG-DELHI-001',
        breed: 'Labrador Retriever',
        age: '2 years',
        gender: 'Male',
        dogType: 'Home Dog',
        healthStatus: 'Healthy',
        vaccinated: 'Yes',
        size: 'Large',
        color: 'Golden',
        behavior: 'Friendly and energetic',
        description: 'Very friendly Labrador who loves to play fetch. Great with kids and other pets.',
        price: 0,
        image: '/uploads/placeholder-dog.jpg',
        sellerId: seller._id,
        location: { city: 'Delhi', state: 'Delhi' }
      },
      {
        dogId: 'DOG-MUMBAI-001',
        breed: 'Beagle',
        age: '1 year',
        gender: 'Female',
        dogType: 'Home Dog',
        healthStatus: 'Healthy',
        vaccinated: 'Yes',
        size: 'Medium',
        color: 'Tri-color',
        behavior: 'Curious and playful',
        description: 'Adorable Beagle with lots of energy. Loves long walks and sniffing adventures.',
        price: 0,
        image: '/uploads/placeholder-dog.jpg',
        sellerId: seller._id,
        location: { city: 'Mumbai', state: 'Maharashtra' }
      },
      {
        dogId: 'DOG-DELHI-002',
        breed: 'German Shepherd',
        age: '3 years',
        gender: 'Male',
        dogType: 'Home Dog',
        healthStatus: 'Healthy',
        vaccinated: 'Yes',
        size: 'Large',
        color: 'Black and Tan',
        behavior: 'Loyal and protective',
        description: 'Well-trained German Shepherd. Great guard dog and family companion.',
        price: 5000,
        image: '/uploads/placeholder-dog.jpg',
        sellerId: seller._id,
        location: { city: 'Delhi', state: 'Delhi' }
      }
    ];

    await Dog.insertMany(sampleDogs);

    // Create sample products
    const sampleProducts = [
      {
        productId: 'PROD-FOO-001',
        name: 'Premium Dog Food - Chicken & Rice',
        description: 'High-quality dog food with real chicken and brown rice. Complete nutrition for adult dogs.',
        price: 1299,
        category: 'Food',
        brand: 'Pawfect',
        stock: 50,
        image: '/uploads/products/placeholder-product.jpg',
        sellerId: seller._id,
        specifications: {
          material: 'Dry Food',
          size: '5kg',
          weight: '5kg',
          color: 'Brown'
        }
      },
      {
        productId: 'PROD-TOY-001',
        name: 'Durable Chew Toy',
        description: 'Long-lasting chew toy for aggressive chewers. Made from natural rubber.',
        price: 499,
        category: 'Toys',
        brand: 'ChewMaster',
        stock: 100,
        image: '/uploads/products/placeholder-product.jpg',
        sellerId: seller._id,
        specifications: {
          material: 'Natural Rubber',
          size: 'Medium',
          weight: '150g',
          color: 'Red'
        }
      },
      {
        productId: 'PROD-ACC-001',
        name: 'Adjustable Dog Collar',
        description: 'Comfortable and durable dog collar with quick-release buckle. Reflective strip for safety.',
        price: 349,
        category: 'Accessories',
        brand: 'SafePaw',
        stock: 75,
        image: '/uploads/products/placeholder-product.jpg',
        sellerId: seller._id,
        specifications: {
          material: 'Nylon',
          size: 'Adjustable (15-20 inches)',
          weight: '50g',
          color: 'Blue'
        }
      },
      {
        productId: 'PROD-BED-001',
        name: 'Orthopedic Dog Bed',
        description: 'Memory foam dog bed for joint support. Waterproof cover and machine washable.',
        price: 2499,
        category: 'Bedding',
        brand: 'ComfyPaws',
        stock: 25,
        image: '/uploads/products/placeholder-product.jpg',
        sellerId: seller._id,
        specifications: {
          material: 'Memory Foam + Polyester',
          size: 'Large (36x28 inches)',
          weight: '2.5kg',
          color: 'Grey'
        }
      }
    ];

    await Product.insertMany(sampleProducts);

    console.log('✅ Database seeded successfully!');
    console.log('📧 Seller Login: seller@paws.com / seller123');
    console.log('📧 User Login: user@example.com / user123');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

// Connect to MongoDB and run seeding
mongoose.connect('mongodb://127.0.0.1:27017/dogworld')
  .then(() => {
    console.log('📦 Connected to MongoDB');
    seedDatabase();
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });