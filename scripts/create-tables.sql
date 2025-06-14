-- DynamoDB用のテーブル設計（参考）
-- 実際のDynamoDBではCLIまたはAWS SDKで作成

-- GPU予約テーブル
CREATE TABLE IF NOT EXISTS gpu_reservations (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    user_name VARCHAR(255) NOT NULL,
    gpu_type VARCHAR(50) NOT NULL,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    purpose TEXT NOT NULL,
    priority ENUM('high', 'medium', 'low') NOT NULL,
    status ENUM('pending', 'approved', 'rejected', 'active', 'completed') NOT NULL,
    ai_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- GPUリソーステーブル
CREATE TABLE IF NOT EXISTS gpu_resources (
    id VARCHAR(255) PRIMARY KEY,
    gpu_type VARCHAR(50) NOT NULL,
    total_count INT NOT NULL,
    available_count INT NOT NULL,
    location VARCHAR(255),
    specifications JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ユーザーテーブル
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    department VARCHAR(255),
    priority_level ENUM('high', 'medium', 'low') DEFAULT 'medium',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 使用履歴テーブル
CREATE TABLE IF NOT EXISTS usage_history (
    id VARCHAR(255) PRIMARY KEY,
    reservation_id VARCHAR(255) NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    gpu_type VARCHAR(50) NOT NULL,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP,
    actual_usage_hours DECIMAL(10,2),
    cost DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (reservation_id) REFERENCES gpu_reservations(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);
