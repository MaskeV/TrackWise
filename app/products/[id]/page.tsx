import Modal from "@/components/Modal";
import PriceInfoCard from "@/components/PriceInfoCard";
import ProductsCard from "@/components/ProductsCard";
import { getProductById, getSimilarProducts } from "@/lib/actions";
import { formatNumber } from "@/lib/utils";
import { Product } from "@/types";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
// interface Props {
//   params: { id: string };
// }
// export default async function pageDetails({ params: { id } }: Props) {
//   const product: Product = await getProductById(id);
//   if (!product) redirect("/");

//   const similarProducts: any = await getSimilarProducts(id);

export default async function ProductDetails({
  params,
}: {
  params: { id: string };
}) {
  const product: Product = await getProductById(params.id);
  if (!product) redirect("/");
  
  const similarProducts = await getSimilarProducts(params.id);
  return (
    <div className="product-container">
      <div className="flex gap-28 xl:flex-row flex-col">
        <div className="product-image">
          <Image
            src={product.image}
            alt={product.title}
            width={580}
            height={400}
            className="mx-auto"
          />
        </div>
        <div className="flex-1 flex flex-col">
          <div className="flex justify-between items-start gap-5 flex-wrap pb-6">
            <div className="flex flex-col gap-3">
              <p className="text-[28px] text-secondary font-semibold">
                {product.title}
              </p>
              <Link
                className="text-base text-black opacity-50"
                href={product.url}
                target="_blank"
              >
                Visit Product
              </Link>
            </div>
            <div className="flex items-center gap-3">
              <div className="product-hearts">
                <Image
                  src="/assets/icons/red-heart.svg"
                  alt="heart"
                  width={20}
                  height={20}
                />
                <p className="text-base font-semibold text-[#D46F77]">
                  {product.productReviews?.split(" ").length > 2
                    ? product.productReviews
                        .replace("ratings", "")
                        .replace(product.productReviews.split(" ")[0], "")
                    : product.productReviews}
                </p>
              </div>
              <div className="p-2 bg-white-200 rounded-10">
                <Image
                  src="/assets/icons/bookmark.svg"
                  alt="bookmark"
                  width={20}
                  height={20}
                />
              </div>
              <div className="p-2 bg-white-200 rounded-10">
                <Image
                  src="/assets/icons/share.svg"
                  alt="share"
                  width={20}
                  height={20}
                />
              </div>
            </div>
          </div>
          <div className="product-info">
            <div className="flex flex-col gap-2">
              <p className="text-[34px] font-bold text-secondary">
                {product.currency}
                {formatNumber(product.currentPrice)}
              </p>
              {product.originalPrice !== product.currentPrice && (
                <p className="text-[21px] line-through text-black opacity-50">
                  {product.originalPrice}
                  {formatNumber(product.currentPrice)}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-4">
              <div className="flex gap-3">
                <div className="product-stars">
                  <Image
                    src="/assets/icons/star.svg"
                    alt="star"
                    height={16}
                    width={16}
                  />
                  <p className="text-sm text-primary font-semibold">
                    {product.starIcon || "25"}
                  </p>
                </div>
                <div className="product-reviews">
                  <Image
                    src="/assets/icons/comment.svg"
                    alt="comment"
                    width={16}
                    height={16}
                  />
                  <p className="text-sm text-secondary font-semibold">
                    {product.productReviews?.split(" ").length > 2
                      ? product.productReviews
                          .replace("ratings", "")
                          .replace(product.productReviews.split(" ")[0], "")
                      : product.productReviews}
                  </p>
                </div>
              </div>
              <p className="text-sm text-black opacity-50">
                <span className="text-primary-green font-semibold">93% </span>{" "}
                of buyers have recommeded this.
              </p>
            </div>
          </div>
          <div className="my-7 flex flex-col gap-5">
            <div className="flex gap-5 flex-wrap">
              <PriceInfoCard
                title="Current Price"
                iconSrc="/assets/icons/price-tag.svg"
                value={`${product.currency} ${formatNumber(
                  product.currentPrice
                )} `}
                borderColor="#b6dbff"
              />
              <PriceInfoCard
                title="Average Price"
                iconSrc="/assets/icons/chart.svg"
                value={`${product.currency} ${formatNumber(
                  product.averagePrice
                )} `}
                borderColor="#8C61FF"
              />
              <PriceInfoCard
                title="Highest Price"
                iconSrc="/assets/icons/arrow-up.svg"
                value={`${product.currency} ${formatNumber(
                  product.highestPrice
                )} `}
                borderColor="#ff0000"
              />
              <PriceInfoCard
                title="Lowest Price"
                iconSrc="/assets/icons/arrow-down.svg"
                value={`${product.currency} ${formatNumber(
                  product.lowestPrice
                )} `}
                borderColor="#BEFFC5"
              />
            </div>
          </div>
          <Modal productId={params.id} />
        </div>
      </div>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-5">
          <h3 className="text-2xl text-secondary font-semibold">
            Product Description
          </h3>
          <div className="flex flex-col gap-4">
            <p className="line-clamp-5">
              {" "}
              {product?.description.replace(/\/\*[\s\S]*?\*\//g, "")}
            </p>
          </div>
        </div>
        <button className="btn w-fit mx-auto flex items-center justify-center gap-3 min-w-[280px]">
          <Image
            src="/assets/icons/bag.svg"
            alt="check"
            width={22}
            height={22}
          />
          <Link href="/" className="text-base text-white">
            Buy Now
          </Link>
        </button>
      </div>
      {similarProducts && similarProducts?.length > 0 && (
        <div className="py-14 flex flex-col gap-2 w-full">
          <p className="section-text">Similar Products</p>

          <div className="flex flex-wrap gap-10 mt-7 w-full">
            {similarProducts.map((product: any) => (
              <ProductsCard key={product._id} product={product} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}