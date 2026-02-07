import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { ContentSection, FooterData, TeamMember, Product, UserProfile, IconLink, ContactLocation, FloatingBubbleConfig, Category, AboutSection, CustomerMessage, CartItem, MediaItem, AdminEntry, OrderStatus } from './../../../declarations/backend/backend.did';

// User Profile Queries
export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      const res = await actor.getCallerUserProfile();
      // Actor returns [] | [UserProfile] per candid; unwrap to null or UserProfile
      return (res && (res as any).length) ? (res as any)[0] as UserProfile : null;
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error('Actor not available');
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      // Invalidate all queries to refresh with new admin permissions
      queryClient.invalidateQueries();
    },
  });
}

// Content Queries
export function useGetHeroSection() {
  const { actor, isFetching } = useActor();

  return useQuery<ContentSection>({
    queryKey: ['heroSection'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getHeroSection();
    },
    enabled: !!actor && !isFetching,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useGetAboutSection() {
  const { actor, isFetching } = useActor();

  return useQuery<AboutSection>({
    queryKey: ['aboutSection'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getAboutSection();
    },
    enabled: !!actor && !isFetching,
    staleTime: 1000 * 60 * 5,
  });
}

export function useGetFooterData() {
  const { actor, isFetching } = useActor();

  return useQuery<FooterData>({
    queryKey: ['footerData'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getFooterData();
    },
    enabled: !!actor && !isFetching,
    staleTime: 1000 * 60 * 5,
  });
}

export function useGetTeamMembers() {
  const { actor, isFetching } = useActor();

  return useQuery<TeamMember[]>({
    queryKey: ['teamMembers'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getTeamMembers();
    },
    enabled: !!actor && !isFetching,
    staleTime: 1000 * 60 * 5,
  });
}

// export function useGetProcessSteps() {
//   const { actor, isFetching } = useActor();

//   return useQuery<ProcessStep[]>({
//     queryKey: ['processSteps'],
//     queryFn: async () => {
//       if (!actor) throw new Error('Actor not available');
//       return actor.getProcessSteps();
//     },
//     enabled: !!actor && !isFetching,
//     staleTime: 1000 * 60 * 5,
//   });
// }

export function useGetProducts() {
  const { actor, isFetching } = useActor();

  return useQuery<[bigint, Product][]>({
    queryKey: ['products'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getProducts();
    },
    enabled: !!actor && !isFetching,
    staleTime: 1000 * 60 * 2, // 2 minutes for products
  });
}

export function useGetHeader() {
  const { actor, isFetching } = useActor();

  return useQuery<ContentSection>({
    queryKey: ['header'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getHeader();
    },
    enabled: !!actor && !isFetching,
    staleTime: 1000 * 60 * 5,
  });
}

export function useGetIconLinks() {
  const { actor, isFetching } = useActor();

  return useQuery<IconLink[]>({
    queryKey: ['iconLinks'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getIconLinks();
    },
    enabled: !!actor && !isFetching,
    staleTime: 1000 * 60 * 5,
  });
}

// Media Gallery Queries
export function useGetMediaItems(page: number) {
  const { actor, isFetching } = useActor();

  return useQuery<MediaItem[]>({
    queryKey: ['mediaItems', page],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getMediaItems(BigInt(page));
    },
    enabled: !!actor && !isFetching,
    staleTime: 1000 * 60 * 5,
  });
}

export function useGetTotalMediaCount() {
  const { actor, isFetching } = useActor();

  return useQuery<bigint>({
    queryKey: ['mediaItems', 'count'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getTotalMediaCount();
    },
    enabled: !!actor && !isFetching,
    staleTime: 1000 * 60 * 5,
  });
}

// Contact Queries
export function useGetContacts() {
  const { actor, isFetching } = useActor();

  return useQuery<ContactLocation[]>({
    queryKey: ['contacts'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getContacts();
    },
    enabled: !!actor && !isFetching,
    staleTime: 1000 * 60 * 5,
  });
}

export function useGetHeadOfficeContact() {
  const { actor, isFetching } = useActor();

  return useQuery<ContactLocation | null>({
    queryKey: ['headOfficeContact'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      const res = await actor.getHeadOfficeContact();
      return (res && (res as any).length) ? (res as any)[0] as ContactLocation : null;
    },
    enabled: !!actor && !isFetching,
    staleTime: 1000 * 60 * 5,
  });
}

// Floating Bubble Queries
export function useGetFloatingBubbleConfig() {
  const { actor, isFetching } = useActor();

  return useQuery<FloatingBubbleConfig>({
    queryKey: ['floatingBubbleConfig'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getFloatingBubbleConfig();
    },
    enabled: !!actor && !isFetching,
    staleTime: 1000 * 60 * 5,
  });
}

// Category Queries
export function useGetCategories() {
  const { actor, isFetching } = useActor();

  return useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      const results = await actor.getCategories();
      // Backend returns [nat, Category][] format, extract just the Category objects
      return results.map(([_, category]) => category);
    },
    enabled: !!actor && !isFetching,
    staleTime: 1000 * 60 * 5,
  });
}

export function useGetProductsByCategory() {
  const { actor, isFetching } = useActor();

  return useMutation({
    mutationFn: async (categoryId: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.getProductsByCategory(categoryId);
    },
  });
}

// Customer Messages Queries
export function useGetCustomerMessages() {
  const { actor, isFetching } = useActor();

  return useQuery<[bigint, CustomerMessage][]>({
    queryKey: ['customerMessages'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getAllCustomerMessages();
    },
    enabled: !!actor && !isFetching,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

export function useGetCustomerMessagesPaginated(page: number) {
  const { actor, isFetching } = useActor();

  return useQuery<CustomerMessage[]>({
    queryKey: ['customerMessages', 'paginated', page],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCustomerMessages(BigInt(page));
    },
    enabled: !!actor && !isFetching,
    staleTime: 1000 * 60 * 2,
  });
}

export function useGetTotalMessageCount() {
  const { actor, isFetching } = useActor();

  return useQuery<bigint>({
    queryKey: ['customerMessages', 'count'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getTotalMessageCount();
    },
    enabled: !!actor && !isFetching,
    staleTime: 1000 * 60 * 2,
  });
}

// Order Queries
export function useGetOrders(page: number) {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ['orders', 'paginated', page],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getOrders(BigInt(page));
    },
    enabled: !!actor && !isFetching,
    staleTime: 1000 * 60 * 2,
  });
}

export function useGetTotalOrderCount() {
  const { actor, isFetching } = useActor();

  return useQuery<bigint>({
    queryKey: ['orders', 'count'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getTotalOrderCount();
    },
    enabled: !!actor && !isFetching,
    staleTime: 1000 * 60 * 2,
  });
}

// Admin Management Queries
export function useGetAdmins() {
  const { actor, isFetching } = useActor();

  return useQuery<AdminEntry[]>({
    queryKey: ['admins'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getAdmins();
    },
    enabled: !!actor && !isFetching,
    staleTime: 1000 * 60 * 5,
  });
}

// Product Price Visibility Queries
export function useGetProductPriceVisibility() {
  const { actor, isFetching } = useActor();

  return useQuery<boolean>({
    queryKey: ['productPriceVisibility'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getProductPriceVisibility();
    },
    enabled: !!actor && !isFetching,
    staleTime: 1000 * 60 * 5,
  });
}

// Content Mutations
export function useUpdateHeroSection() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (hero: ContentSection) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateHeroSection(hero);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['heroSection'] });
    },
  });
}

export function useUpdateAboutSection() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (about: AboutSection) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateAboutSection(about);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aboutSection'] });
      queryClient.invalidateQueries({ queryKey: ['processSteps'] });
      queryClient.invalidateQueries({ queryKey: ['teamMembers'] });
    },
  });
}

export function useUpdateFooterData() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (footer: FooterData) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateFooterData(footer);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['footerData'] });
    },
  });
}

// Products Mutations
export function useAddProduct() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (product: Product) => {
      if (!actor) throw new Error('Actor not available');
      await actor.addProduct(product);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

export function useUpdateProduct() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (product: Product) => {
      if (!actor) throw new Error('Actor not available');
      await actor.updateProduct(product);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

export function useDeleteProduct() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error('Actor not available');
      await actor.deleteProduct(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

// Category Mutations
export function useAddCategory() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (name: string) => {
      if (!actor) throw new Error('Actor not available');
      await actor.addCategory(name);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
}

export function useUpdateCategory() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (category: Category) => {
      if (!actor) throw new Error('Actor not available');
      await actor.updateCategory(category);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
}

export function useDeleteCategory() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (categoryId: bigint) => {
      if (!actor) throw new Error('Actor not available');
      await actor.deleteCategory(categoryId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

// Customer Messages Mutations
export function useSubmitCustomerMessage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (message: CustomerMessage) => {
      if (!actor) throw new Error('Actor not available');
      await actor.submitCustomerMessage(message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customerMessages'] });
    },
  });
}

// New: Delete Customer Message
export function useDeleteCustomerMessage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteCustomerMessage(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customerMessages'] });
    },
  });
}

// Order Mutations
export function useSubmitOrder() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      customerName: string;
      customerEmail: string;
      customerPhone: string;
      items: CartItem[];
    }) => {
      if (!actor) throw new Error('Actor not available');
      await actor.submitOrder(
        params.customerName,
        params.customerEmail,
        params.customerPhone,
        params.items
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['customerMessages'] });
    },
  });
}

// New: Delete Order Mutation
export function useDeleteOrder() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error('Actor not available');
      // Backend exposes cancelOrder rather than deleteOrder
      await actor.deleteOrder(id);
    },
    onSuccess: () => {
      // Refresh orders list and total count
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['orders', 'count'] });
    },
  });
}

// New: Update Order Status Mutation
export function useUpdateOrder() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { id: bigint; status: OrderStatus }) => {
      if (!actor) throw new Error('Actor not available');
      await actor.updateOrderStatus(params.id, params.status);
    },
    onSuccess: () => {
      // Refresh orders list and total count
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['orders', 'count'] });
    },
  });
}

// Media Mutations
export function useAddMediaItem() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      url: string;
      caption: string;
      description: string;
      mediaType: string;
    }) => {
      if (!actor) throw new Error('Actor not available');
      await actor.addMediaItem(params.url, params.caption, params.description, params.mediaType);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mediaItems'] });
    },
  });
}

export function useUpdateMediaItem() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      id: bigint;
      url: string;
      caption: string;
      description: string;
    }) => {
      if (!actor) throw new Error('Actor not available');
      await actor.updateMediaItem(params.id, params.url, params.caption, params.description);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mediaItems'] });
    },
  });
}

export function useDeleteMediaItem() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error('Actor not available');
      await actor.deleteMediaItem(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mediaItems'] });
    },
  });
}

// Process Steps Mutations
// export function useUpdateProcessSteps() {
//   const { actor } = useActor();
//   const queryClient = useQueryClient();

//   return useMutation({
//     mutationFn: async (steps: ProcessStep[]) => {
//       if (!actor) throw new Error('Actor not available');
//       return actor.updateProcessSteps(steps);
//     },
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: ['processSteps'] });
//     },
//   });
// }

// Team Members Mutations
export function useUpdateTeamMembers() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (members: TeamMember[]) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateTeamMembers(members);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teamMembers'] });
    },
  });
}

// Icon Links Mutations
export function useUpdateIconLinks() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (links: IconLink[]) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateIconLinks(links);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['iconLinks'] });
    },
  });
}

// Media Mutations (for admin CMS - uses MediaItem type)
export function useUpdateMedia() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (media: MediaItem[]) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateMedia(media);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mediaItems'] });
    },
  });
}

// Header Mutation
export function useUpdateHeader() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (header: ContentSection) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateHeader(header);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['header'] });
    },
  });
}

// Contact Mutations
export function useAddContact() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (contact: ContactLocation) => {
      if (!actor) throw new Error('Actor not available');
      await actor.addContact(contact);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      queryClient.invalidateQueries({ queryKey: ['headOfficeContact'] });
    },
  });
}

export function useUpdateContact() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (contact: ContactLocation) => {
      if (!actor) throw new Error('Actor not available');
      await actor.updateContact(contact);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      queryClient.invalidateQueries({ queryKey: ['headOfficeContact'] });
    },
  });
}

export function useDeleteContact() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error('Actor not available');
      await actor.deleteContact(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      queryClient.invalidateQueries({ queryKey: ['headOfficeContact'] });
    },
  });
}

export function useSetHeadOffice() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error('Actor not available');
      await actor.setHeadOffice(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      queryClient.invalidateQueries({ queryKey: ['headOfficeContact'] });
    },
  });
}

// Floating Bubble Mutations
export function useUpdateFloatingBubbleConfig() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (config: FloatingBubbleConfig) => {
      if (!actor) throw new Error('Actor not available');
      await actor.updateFloatingBubbleConfig(config);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['floatingBubbleConfig'] });
    },
  });
}

// Admin Management Mutations
export function useAddAdmin() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (principalId: string) => {
      if (!actor) throw new Error('Actor not available');
      // backend expects principal id as string
      await actor.addAdmin(principalId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admins'] });
    },
  });
}

export function useRemoveAdmin() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (principalId: string) => {
      if (!actor) throw new Error('Actor not available');
      // removeAdmin in candid expects Principal type; pass as string if actor wrapper accepts it
      await actor.removeAdmin(principalId as any);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admins'] });
    },
  });
}

// Product Price Visibility Mutations
export function useUpdateProductPriceVisibility() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (showPrices: boolean) => {
      if (!actor) throw new Error('Actor not available');
      await actor.updateProductPriceVisibility(showPrices);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productPriceVisibility'] });
    },
  });
}
