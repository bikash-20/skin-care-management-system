import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { categoriesService, productsService } from '../services/endpoints';
import { Category, Product } from '../types';
import { Spinner, ErrorBanner, EmptyState, PageHeader } from '../components/UI';

export default function ProductsPage() {
    const [search, setSearch] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [skinType, setSkinType] = useState('');

    const { data: categoriesData } = useApi<{ categories: Category[] }>(() => categoriesService.list(), []);
    const { data, loading, error, reload } = useApi<{ products: Product[] }>(
        () => productsService.list({ search, category_id: categoryId || undefined, skin_type: skinType || undefined }),
        [search, categoryId, skinType]
    );

    return (
        <>
            <PageHeader title="Product Catalog" subtitle="Browse products and add them to your personal cabinet." />

            <div className="toolbar">
                <input
                    className="input"
                    placeholder="Search by name or brand..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{ maxWidth: 300 }}
                />
                <select className="select" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} style={{ maxWidth: 200 }}>
                    <option value="">All categories</option>
                    {categoriesData?.categories.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                </select>
                <select className="select" value={skinType} onChange={(e) => setSkinType(e.target.value)} style={{ maxWidth: 200 }}>
                    <option value="">Any skin type</option>
                    <option value="DRY">Dry</option>
                    <option value="OILY">Oily</option>
                    <option value="COMBINATION">Combination</option>
                    <option value="NORMAL">Normal</option>
                    <option value="SENSITIVE">Sensitive</option>
                </select>
            </div>

            {loading && <Spinner label="Loading products..." />}
            {error && <ErrorBanner message={error} onRetry={reload} />}

            {!loading && !error && data && data.products.length === 0 && (
                <EmptyState title="No products match your filters" />
            )}

            <div className="card-grid">
                {(data?.products ?? []).map((p) => (
                    <Link key={p.id} to={`/products/${p.id}`} className="card" style={{ color: 'inherit' }}>
                        <div className="row space-between">
                            <strong>{p.name}</strong>
                            <span className="tag tag--muted">{p.category_name}</span>
                        </div>
                        <p className="muted tiny" style={{ margin: '0.25rem 0' }}>{p.brand ?? '—'}</p>
                        <p className="tiny">{p.description ?? ''}</p>
                        {p.suitable_skin_types && (
                            <p className="muted tiny">Suitable: {p.suitable_skin_types}</p>
                        )}
                    </Link>
                ))}
            </div>
        </>
    );
}