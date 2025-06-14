import bcrypt from 'bcryptjs'

const password = 'admin123'
const saltRounds = 10

// Generate hash
const hash = bcrypt.hashSync(password, saltRounds)
console.log('Generated hash for "admin123":', hash)

// Test hash yang ada di database
const existingHash = '$2b$10$6cu75Ox/kKw8eJezh6XKE.T3Rx1TMa1gBExLD.cH/IieaMeAnG75e'
const isValid = bcrypt.compareSync(password, existingHash)
console.log('Password "admin123" matches hash:', isValid)

// Test hash dari database Anda (dari screenshot)
const dbHash = '$2b$10$6cu75Ox/kKw8eJezh6XKE.T3Rx1TMa1gBExLD.cH/IieaMeAnG75e'
const isDbValid = bcrypt.compareSync(password, dbHash)
console.log('Password matches database hash:', isDbValid)