# E-Commerce Project

## Description
This is an e-commerce application built with Node.js, Apollo GraphQL, and MongoDB. It provides a backend API for managing products, users, orders, and more.

## Table of Contents
- [Features](#features)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [API Documentation](#api-documentation)
- [Contributing](#contributing)
- [License](#license)

## Features
- User authentication and authorization
- Product management (CRUD operations)
- Order processing and management
- Apollo GraphQL API for querying and mutating data
- MongoDB for database storage

## Installation

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or Atlas)

### Steps
1. Clone the repository:
    ```sh
    git clone https://github.com/yourusername/e-commerce-project.git
    cd e-commerce-project
    ```

2. Install dependencies:
    ```sh
    npm install
    ```

3. Set up environment variables:
    Create a `.env` file in the root directory and add the following variables:
    ```env
    PORT=4000
    MONGODB_URI=mongodb://localhost:27017/ecommerce
    JWT_SECRET=your_jwt_secret
    ```

## Configuration
- **PORT**: The port number where the server will run.
- **MONGODB_URI**: The MongoDB connection string.
- **JWT_SECRET**: A secret key for JSON Web Token (JWT) authentication.

## Usage

### Running the Server
1. Start the server:
    ```sh
    npm start
    ```
2. The server will run on `http://localhost:4000`.

### Apollo Server Playground
- Access the Apollo Server Playground at `http://localhost:4000/graphql`.


## License
This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
