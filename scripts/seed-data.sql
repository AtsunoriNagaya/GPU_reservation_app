-- サンプルデータの挿入

-- GPUリソースの初期データ
INSERT INTO gpu_resources (id, gpu_type, total_count, available_count, location, specifications) VALUES
('gpu-a100-1', 'A100', 8, 6, 'データセンター1', '{"memory": "40GB", "compute_capability": "8.0", "tensor_cores": "3rd gen"}'),
('gpu-v100-1', 'V100', 12, 8, 'データセンター1', '{"memory": "16GB", "compute_capability": "7.0", "tensor_cores": "1st gen"}'),
('gpu-rtx4090-1', 'RTX 4090', 16, 12, 'データセンター2', '{"memory": "24GB", "compute_capability": "8.9", "tensor_cores": "4th gen"}'),
('gpu-h100-1', 'H100', 4, 2, 'データセンター1', '{"memory": "80GB", "compute_capability": "9.0", "tensor_cores": "4th gen"}');

-- ユーザーの初期データ
INSERT INTO users (id, name, email, department, priority_level) VALUES
('user-001', '田中太郎', 'tanaka@example.com', '機械学習研究室', 'medium'),
('user-002', '佐藤花子', 'sato@example.com', 'コンピュータビジョン研究室', 'high'),
('user-003', '鈴木一郎', 'suzuki@example.com', '自然言語処理研究室', 'medium'),
('user-004', '高橋美咲', 'takahashi@example.com', 'ロボティクス研究室', 'low');

-- サンプル予約データ
INSERT INTO gpu_reservations (id, user_id, user_name, gpu_type, start_time, end_time, purpose, priority, status, ai_reason) VALUES
('res-001', 'user-001', '田中太郎', 'A100', '2024-01-15 10:00:00', '2024-01-15 14:00:00', '深層学習モデルの訓練実験', 'medium', 'approved', '通常の研究活動として適切な優先度'),
('res-002', 'user-002', '佐藤花子', 'H100', '2024-01-15 15:00:00', '2024-01-15 19:00:00', '論文締切前の最終実験', 'high', 'approved', '論文締切が近く、緊急性が高い'),
('res-003', 'user-003', '鈴木一郎', 'V100', '2024-01-16 09:00:00', '2024-01-16 12:00:00', 'BERT モデルのファインチューニング', 'medium', 'pending', '標準的な自然言語処理タスク'),
('res-004', 'user-004', '高橋美咲', 'RTX 4090', '2024-01-16 14:00:00', '2024-01-16 16:00:00', '学習用の簡単な実験', 'low', 'approved', '学習目的で優先度は低いが承認');
