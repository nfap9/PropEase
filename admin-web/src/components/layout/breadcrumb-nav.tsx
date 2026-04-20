import { Link } from 'react-router-dom';
import { Breadcrumb as AntBreadcrumb } from 'antd';
import { ChevronRight } from 'lucide-react';
import { useBreadcrumb } from '@/hooks/use-breadcrumb';

/**
 * 面包屑导航组件
 *
 * 基于 useBreadcrumb hook 自动生成面包屑
 */
export function BreadcrumbNav() {
  const breadcrumbs = useBreadcrumb();

  if (breadcrumbs.length === 0) {
    return null;
  }

  return (
    <AntBreadcrumb
      separator={<ChevronRight className="h-4 w-4 text-gray-400" />}
      items={breadcrumbs.map((item, index) => {
        const isLast = index === breadcrumbs.length - 1;
        return {
          title: isLast ? (
            <span className="text-sm font-medium text-gray-900">{item.label}</span>
          ) : (
            <Link
              to={item.href}
              className="text-sm text-gray-500 hover:text-gray-900"
            >
              {item.label}
            </Link>
          ),
        };
      })}
    />
  );
}
