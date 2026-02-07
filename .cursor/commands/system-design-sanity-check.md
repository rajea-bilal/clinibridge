# System Design Sanity Check

Use this command to sanity check your system design and architectural decisions. This acts as a guardrail to ensure you're making sound choices when building distributed systems and applications.

## Queue Management

### Queue Size
- ✅ **Small queues are better than large queues** - Once a queue gets large enough, requests take so long to reach the front that clients have already timed out and retried
- ✅ **Avoid processing useless work** - If requests are likely to timeout before processing, you're wasting resources
- ✅ **Monitor queue depth** - Set up alerts for when queues exceed healthy thresholds

### Queue Discipline Under Load
- ✅ **Consider LIFO under load** - When queues must get long, switching to LIFO (Last In, First Out) ensures you're making progress on requests users still care about
- ✅ **Actively drop requests when overloaded** - Don't just let queues grow; proactively drop requests to signal overload before the system falls over
- ✅ **Implement circuit breakers** - Stop accepting new work when the system is overwhelmed

## Request Handling

### Timeouts and Retries
- ✅ **Set appropriate timeouts** - Timeouts should be shorter than client retry windows to avoid duplicate work
- ✅ **Idempotency** - Ensure operations can be safely retried without side effects
- ✅ **Exponential backoff** - Implement backoff strategies for retries to prevent thundering herd

### Request Prioritization
- ✅ **Prioritize fresh requests** - Under load, newer requests are more likely to still be relevant
- ✅ **Drop stale requests** - If a request has been queued too long, it's likely the client has given up
- ✅ **User-facing vs background** - Prioritize user-facing requests over background jobs

## System Architecture

### Scalability
- ✅ **Horizontal scaling** - Design for horizontal scaling rather than vertical
- ✅ **Stateless services** - Keep services stateless when possible for easier scaling
- ✅ **Database connection pooling** - Limit and pool database connections appropriately

### Resilience
- ✅ **Graceful degradation** - System should degrade gracefully under load, not fail catastrophically
- ✅ **Rate limiting** - Implement rate limiting to prevent abuse and overload
- ✅ **Load shedding** - Drop non-critical requests when under extreme load

### Data Consistency
- ✅ **Choose appropriate consistency model** - Not everything needs strong consistency
- ✅ **Eventual consistency trade-offs** - Understand when eventual consistency is acceptable
- ✅ **Idempotent operations** - Design operations to be safely retryable

## Performance

### Caching Strategy
- ✅ **Cache frequently accessed data** - But be aware of cache invalidation complexity
- ✅ **Cache expiration** - Set appropriate TTLs to balance freshness and performance
- ✅ **Cache warming** - Consider warming caches for critical paths

### Database Design
- ✅ **Index appropriately** - But don't over-index (writes become expensive)
- ✅ **Query optimization** - Avoid N+1 queries, use appropriate joins
- ✅ **Partitioning strategy** - Consider partitioning for large datasets

## Monitoring and Observability

- ✅ **Metrics for queue depth** - Monitor queue sizes and processing times
- ✅ **Error rates** - Track error rates and types
- ✅ **Latency percentiles** - Monitor P50, P95, P99 latencies
- ✅ **SLO/SLA tracking** - Define and track service level objectives

## Common Anti-Patterns to Avoid

- ❌ **Unbounded queues** - Queues that can grow indefinitely
- ❌ **Processing stale requests** - Working on requests that clients have already given up on
- ❌ **No timeout handling** - Requests that can hang indefinitely
- ❌ **Synchronous blocking operations** - Blocking the event loop or request handlers
- ❌ **No backpressure** - Not signaling when the system is overloaded
- ❌ **Thundering herd** - All clients retrying at the same time

## When to Use This Checklist

Use this command when:
- Designing new features or services
- Reviewing architectural decisions
- Debugging performance issues
- Planning for scale
- Making trade-offs between consistency, availability, and performance

## Questions to Ask

1. **What happens under load?** - How does the system behave when traffic spikes?
2. **What gets dropped first?** - What's the priority order when shedding load?
3. **How do clients know about overload?** - Is there backpressure signaling?
4. **What's the worst case?** - What happens if queues fill up completely?
5. **Is this idempotent?** - Can operations be safely retried?

## Key Principle

**Good systems have small queues. If your queue has to get long, then switching to LIFO under load at least ensures you're making progress on requests users still care about.**

