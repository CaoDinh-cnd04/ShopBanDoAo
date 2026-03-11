import { useState } from 'react';
import PropTypes from 'prop-types';
import { Form, Row, Col, Button, InputGroup } from 'react-bootstrap';
import { FaSearch, FaFilter, FaTimes } from 'react-icons/fa';

const FilterBar = ({
    onFilterChange,
    onSearchChange,
    onSortChange,
    filterOptions = [],
    sortOptions = [],
    searchPlaceholder = 'Tìm kiếm...',
    showSearch = true,
    showFilter = true,
    showSort = true
}) => {
    const [activeFilter, setActiveFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('newest');

    const handleFilterChange = (filter) => {
        setActiveFilter(filter);
        onFilterChange?.(filter);
    };

    const handleSearchChange = (e) => {
        const value = e.target.value;
        setSearchTerm(value);
        onSearchChange?.(value);
    };

    const handleSortChange = (e) => {
        const value = e.target.value;
        setSortBy(value);
        onSortChange?.(value);
    };

    const clearSearch = () => {
        setSearchTerm('');
        onSearchChange?.('');
    };

    const defaultFilterOptions = [
        { value: 'all', label: 'Tất cả' },
        { value: 'pending', label: 'Chờ xác nhận' },
        { value: 'confirmed', label: 'Đã xác nhận' },
        { value: 'completed', label: 'Hoàn thành' },
        { value: 'cancelled', label: 'Đã hủy' },
    ];

    const defaultSortOptions = [
        { value: 'newest', label: 'Mới nhất' },
        { value: 'oldest', label: 'Cũ nhất' },
        { value: 'price-high', label: 'Giá cao' },
        { value: 'price-low', label: 'Giá thấp' },
    ];

    const filters = filterOptions.length > 0 ? filterOptions : defaultFilterOptions;
    const sorts = sortOptions.length > 0 ? sortOptions : defaultSortOptions;

    return (
        <div className="filter-bar mb-4">
            <Row className="g-3">
                {showSearch && (
                    <Col md={showFilter && showSort ? 4 : showFilter || showSort ? 6 : 12}>
                        <InputGroup>
                            <InputGroup.Text>
                                <FaSearch />
                            </InputGroup.Text>
                            <Form.Control
                                type="text"
                                placeholder={searchPlaceholder}
                                value={searchTerm}
                                onChange={handleSearchChange}
                            />
                            {searchTerm && (
                                <Button variant="outline-secondary" onClick={clearSearch}>
                                    <FaTimes />
                                </Button>
                            )}
                        </InputGroup>
                    </Col>
                )}

                {showFilter && (
                    <Col md={showSearch && showSort ? 4 : showSearch || showSort ? 6 : 12}>
                        <div className="d-flex gap-2 flex-wrap">
                            {filters.map((filter) => (
                                <Button
                                    key={filter.value}
                                    variant={activeFilter === filter.value ? 'primary' : 'outline-primary'}
                                    size="sm"
                                    onClick={() => handleFilterChange(filter.value)}
                                    className="d-inline-flex align-items-center gap-1"
                                >
                                    <FaFilter size={12} />
                                    {filter.label}
                                </Button>
                            ))}
                        </div>
                    </Col>
                )}

                {showSort && (
                    <Col md={showSearch && showFilter ? 4 : showSearch || showFilter ? 6 : 12}>
                        <Form.Select value={sortBy} onChange={handleSortChange}>
                            {sorts.map((sort) => (
                                <option key={sort.value} value={sort.value}>
                                    {sort.label}
                                </option>
                            ))}
                        </Form.Select>
                    </Col>
                )}
            </Row>
        </div>
    );
};

FilterBar.propTypes = {
    onFilterChange: PropTypes.func,
    onSearchChange: PropTypes.func,
    onSortChange: PropTypes.func,
    filterOptions: PropTypes.arrayOf(
        PropTypes.shape({
            value: PropTypes.string.isRequired,
            label: PropTypes.string.isRequired,
        })
    ),
    sortOptions: PropTypes.arrayOf(
        PropTypes.shape({
            value: PropTypes.string.isRequired,
            label: PropTypes.string.isRequired,
        })
    ),
    searchPlaceholder: PropTypes.string,
    showSearch: PropTypes.bool,
    showFilter: PropTypes.bool,
    showSort: PropTypes.bool,
};

export default FilterBar;
